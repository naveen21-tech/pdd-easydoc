import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify Faculty / Admin Permissions
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Only faculty can access classroom intelligence analytics.' }, { status: 403 });
    }

    // 2. Fetch all enrolled students
    const { data: membersList } = await supabase
      .from('GroupMember')
      .select('id, userId, role, joinedAt, user:Profile!userId(id, name, email, avatarUrl)')
      .eq('groupId', groupId);

    const students = (membersList || []).filter((m: any) => m.userId !== group.createdBy);
    const totalStudents = students.length;

    // 3. Fetch all assignments and submissions
    const { data: assignments } = await supabase
      .from('GroupAssignment')
      .select('id, title, totalMarks, createdAt, dueDate')
      .eq('groupId', groupId);

    const { data: submissions } = await supabase
      .from('GroupAssignmentSubmission')
      .select('id, assignmentId, userId, qualityScore, status, submittedAt')
      .eq('groupId', groupId);

    const assignmentList = assignments || [];
    const submissionList = submissions || [];

    // Assignment metrics
    const totalExpectedSubmissions = totalStudents * assignmentList.length;
    const totalCompletedSubmissions = submissionList.length;
    const assignmentSubmissionRate = totalExpectedSubmissions > 0
      ? Math.round((totalCompletedSubmissions / totalExpectedSubmissions) * 100)
      : (assignmentList.length > 0 ? 0 : 100);

    const qualityScores = submissionList.map((s: any) => s.qualityScore || 0);
    const avgAssignmentQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
      : 0;

    // 4. Fetch all MCQ tests, questions, and attempts
    const { data: tests } = await supabase
      .from('GroupMcqTest')
      .select('id, title, totalMarks')
      .eq('groupId', groupId);

    const testIds = (tests || []).map((t: any) => t.id);

    let allQuestions: any[] = [];
    let allAttempts: any[] = [];

    if (testIds.length > 0) {
      const [{ data: qData }, { data: attData }] = await Promise.all([
        supabase.from('GroupMcqQuestion').select('*').in('testId', testIds),
        supabase.from('GroupMcqAttempt').select('*').in('testId', testIds),
      ]);
      allQuestions = qData || [];
      allAttempts = attData || [];
    }

    // MCQ metrics
    const testPercentages = allAttempts.map((a: any) => Number(a.percentage) || 0);
    const mcqAverage = testPercentages.length > 0
      ? Math.round(testPercentages.reduce((a: number, b: number) => a + b, 0) / testPercentages.length)
      : 0;

    // Participation: Students with >=1 submission or >=1 test attempt
    const activeStudentIds = new Set<string>();
    submissionList.forEach((s: any) => activeStudentIds.add(s.userId));
    allAttempts.forEach((a: any) => activeStudentIds.add(a.userId));

    const participationRate = totalStudents > 0
      ? Math.round((activeStudentIds.size / totalStudents) * 100)
      : 0;

    // 5. Topic-Wise Performance Breakdown
    const topicAgg: Record<string, { totalScore: number; count: number; percentages: number[] }> = {};

    allAttempts.forEach((att: any) => {
      if (att.topicScores && typeof att.topicScores === 'object') {
        Object.entries(att.topicScores).forEach(([tName, data]: [string, any]) => {
          if (!topicAgg[tName]) topicAgg[tName] = { totalScore: 0, count: 0, percentages: [] };
          const p = Number(data.percentage) || 0;
          topicAgg[tName].percentages.push(p);
          topicAgg[tName].totalScore += p;
          topicAgg[tName].count++;
        });
      }
    });

    const topicBreakdown = Object.entries(topicAgg).map(([topic, stats]) => {
      const avg = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
      return {
        topic,
        averagePercentage: avg,
        totalEvaluations: stats.count,
      };
    });

    topicBreakdown.sort((a, b) => b.averagePercentage - a.averagePercentage);

    const strongestTopic = topicBreakdown.length > 0 ? topicBreakdown[0] : null;
    const weakestTopic = topicBreakdown.length > 0 ? topicBreakdown[topicBreakdown.length - 1] : null;

    // 6. Most Missed Question Analysis
    const questionMissStats: Record<string, { question: any; wrong: number; correct: number; total: number }> = {};

    allQuestions.forEach((q: any) => {
      questionMissStats[q.id] = { question: q, wrong: 0, correct: 0, total: 0 };
    });

    allAttempts.forEach((att: any) => {
      const ans = att.answers || {};
      allQuestions.forEach((q: any) => {
        if (q.testId === att.testId) {
          const studentChoice = ans[q.id]?.toUpperCase();
          if (studentChoice) {
            questionMissStats[q.id].total++;
            if (studentChoice === q.correctOption?.toUpperCase()) {
              questionMissStats[q.id].correct++;
            } else {
              questionMissStats[q.id].wrong++;
            }
          }
        }
      });
    });

    const missedRanked = Object.values(questionMissStats)
      .filter((item) => item.total > 0)
      .map((item) => {
        const testObj = (tests || []).find((t: any) => t.id === item.question.testId);
        const missPercentage = item.total > 0 ? Math.round((item.wrong / item.total) * 100) : 0;
        return {
          questionId: item.question.id,
          questionText: item.question.question,
          topic: item.question.topic || 'General',
          testName: testObj?.title || 'MCQ Test',
          correctCount: item.correct,
          incorrectCount: item.wrong,
          totalResponses: item.total,
          missPercentage,
        };
      });

    missedRanked.sort((a, b) => b.missPercentage - a.missPercentage);
    const mostMissedQuestion = missedRanked.length > 0 && missedRanked[0].missPercentage > 0 ? missedRanked[0] : null;

    // 7. Student Performance Ranking & Drill-Down Profiles
    const studentPerformanceProfiles = students.map((st: any) => {
      const studentSubs = submissionList.filter((s: any) => s.userId === st.userId);
      const studentAttempts = allAttempts.filter((a: any) => a.userId === st.userId);

      const subScores = studentSubs.map((s: any) => s.qualityScore || 0);
      const studentAvgSubScore = subScores.length > 0 ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : null;

      const mcqScores = studentAttempts.map((a: any) => Number(a.percentage) || 0);
      const studentAvgMcqScore = mcqScores.length > 0 ? Math.round(mcqScores.reduce((a, b) => a + b, 0) / mcqScores.length) : null;

      // Overall Composite Score (weighted average)
      let compositeScore = 0;
      if (studentAvgSubScore !== null && studentAvgMcqScore !== null) {
        compositeScore = Math.round(studentAvgSubScore * 0.5 + studentAvgMcqScore * 0.5);
      } else if (studentAvgSubScore !== null) {
        compositeScore = studentAvgSubScore;
      } else if (studentAvgMcqScore !== null) {
        compositeScore = studentAvgMcqScore;
      }

      // Pending assignments count
      const pendingAssignmentsCount = Math.max(0, assignmentList.length - studentSubs.length);

      return {
        userId: st.userId,
        name: st.user?.name || (st.user?.email ? st.user.email.split('@')[0] : 'Student'),
        email: st.user?.email || '',
        avatarUrl: st.user?.avatarUrl || null,
        joinedAt: st.joinedAt,
        assignmentsCompleted: studentSubs.length,
        assignmentsTotal: assignmentList.length,
        pendingAssignments: pendingAssignmentsCount,
        averageAssignmentScore: studentAvgSubScore,
        mcqTestsAttempted: studentAttempts.length,
        averageMcqScore: studentAvgMcqScore,
        overallScore: compositeScore,
        hasActivity: studentSubs.length > 0 || studentAttempts.length > 0,
      };
    });

    // Top performers (overall >= 75%)
    const topPerformingStudents = studentPerformanceProfiles
      .filter((st) => st.hasActivity && st.overallScore >= 75)
      .sort((a, b) => b.overallScore - a.overallScore);

    // Students needing attention (overall < 60% or pending items)
    const studentsNeedingAttention = studentPerformanceProfiles
      .filter((st) => (st.hasActivity && st.overallScore < 60) || st.pendingAssignments > 0 || !st.hasActivity)
      .sort((a, b) => a.overallScore - b.overallScore);

    // 8. Generate Automatic Real Insights
    const automaticInsights: string[] = [];

    if (totalStudents > 0) {
      if (studentsNeedingAttention.length > 0) {
        automaticInsights.push(`${studentsNeedingAttention.length} student${studentsNeedingAttention.length > 1 ? 's are' : ' is'} below the performance threshold or have pending coursework.`);
      }
      if (weakestTopic && weakestTopic.averagePercentage < 70) {
        automaticInsights.push(`"${weakestTopic.topic}" is the class's weakest area with ${weakestTopic.averagePercentage}% average proficiency.`);
      }
      if (mostMissedQuestion && mostMissedQuestion.missPercentage >= 50) {
        automaticInsights.push(`Question "${mostMissedQuestion.questionText.slice(0, 50)}..." was missed by ${mostMissedQuestion.missPercentage}% of students in ${mostMissedQuestion.testName}.`);
      }
      if (assignmentSubmissionRate >= 80) {
        automaticInsights.push(`Strong assignment engagement: ${assignmentSubmissionRate}% of expected assignments have been submitted.`);
      } else if (assignmentList.length > 0) {
        automaticInsights.push(`Assignment submission rate is ${assignmentSubmissionRate}%. ${totalExpectedSubmissions - totalCompletedSubmissions} submissions remain pending.`);
      }
      if (participationRate >= 80) {
        automaticInsights.push(`High active participation rate across the batch (${participationRate}%).`);
      }
    }

    if (automaticInsights.length === 0) {
      automaticInsights.push('Upload notes, create assignments, and publish tests to generate class intelligence insights.');
    }

    return NextResponse.json({
      classroomName: group.name,
      summary: {
        totalStudents,
        assignmentSubmissionRate,
        averageAssignmentQuality: avgAssignmentQuality,
        mcqAverage,
        participationRate,
        topPerformingCount: topPerformingStudents.length,
        needsAttentionCount: studentsNeedingAttention.length,
      },
      topicAnalysis: {
        strongestTopic,
        weakestTopic,
        topics: topicBreakdown,
      },
      mcqInsights: {
        mostMissedQuestion,
        allMissedQuestions: missedRanked.slice(0, 5),
      },
      assignmentInsights: assignmentList.map((a: any) => {
        const subs = submissionList.filter((s: any) => s.assignmentId === a.id);
        const scores = subs.map((s: any) => s.qualityScore || 0);
        const avg = scores.length > 0 ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;
        return {
          id: a.id,
          title: a.title,
          totalStudents,
          submittedCount: subs.length,
          pendingCount: Math.max(0, totalStudents - subs.length),
          lateCount: subs.filter((s: any) => s.status === 'LATE').length,
          submissionPercentage: totalStudents > 0 ? Math.round((subs.length / totalStudents) * 100) : 0,
          averageQualityScore: avg,
        };
      }),
      studentPerformance: {
        topPerformers: topPerformingStudents.slice(0, 6),
        needsAttention: studentsNeedingAttention.slice(0, 6),
        allProfiles: studentPerformanceProfiles,
      },
      automaticInsights,
    });
  } catch (err: any) {
    console.error('Faculty intelligence error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to compute classroom intelligence' }, { status: 500 });
  }
}
