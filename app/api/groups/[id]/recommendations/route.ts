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

    // Verify membership in classroom
    const { data: group } = await supabase.from('Group').select('id, name, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    // 1. Fetch classroom knowledge materials to link in recommendations
    const { data: materials } = await supabase
      .from('GroupKnowledgeMaterial')
      .select('id, title, subject, unit, topic, chapter, fileName')
      .eq('groupId', groupId);

    const availableMaterials = materials || [];

    // =========================================================================
    // A. FACULTY RECOMMENDATIONS
    // =========================================================================
    if (isAdmin) {
      // Aggregate all student attempts
      const { data: attempts } = await supabase
        .from('GroupMcqAttempt')
        .select('topicScores, percentage')
        .eq('groupId', groupId);

      const topicStats: Record<string, { totalScore: number; count: number; studentCount: number }> = {};

      (attempts || []).forEach((att: any) => {
        if (att.topicScores && typeof att.topicScores === 'object') {
          Object.entries(att.topicScores).forEach(([tName, data]: [string, any]) => {
            if (!topicStats[tName]) topicStats[tName] = { totalScore: 0, count: 0, studentCount: 0 };
            const p = Number(data.percentage) || 0;
            topicStats[tName].totalScore += p;
            topicStats[tName].count++;
            if (p < 70) topicStats[tName].studentCount++;
          });
        }
      });

      const facultyRecommendations = Object.entries(topicStats)
        .map(([topic, stats]) => {
          const avg = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
          const relatedDoc = availableMaterials.find(
            (m) =>
              m.topic.toLowerCase().includes(topic.toLowerCase()) ||
              m.subject.toLowerCase().includes(topic.toLowerCase()) ||
              topic.toLowerCase().includes(m.topic.toLowerCase())
          );

          return {
            topic,
            averageScore: avg,
            strugglingStudentCount: stats.studentCount,
            severity: avg < 50 ? 'HIGH' : avg < 70 ? 'MEDIUM' : 'LOW',
            recommendedActions: [
              `Conduct a 15-minute concept revision session on ${topic}.`,
              relatedDoc
                ? `Remind students to review "${relatedDoc.title}" (${relatedDoc.unit}).`
                : `Upload supplementary study notes and diagrams for ${topic} in the Knowledge Hub.`,
              `Publish a targeted 10-question practice test on ${topic}.`,
            ],
          };
        })
        .filter((r) => r.averageScore < 75);

      facultyRecommendations.sort((a, b) => a.averageScore - b.averageScore);

      return NextResponse.json({
        role: 'FACULTY',
        recommendations: facultyRecommendations,
      });
    }

    // =========================================================================
    // B. STUDENT PERSONALIZED RECOMMENDATIONS
    // =========================================================================
    // Fetch student's own attempts
    const { data: myAttempts } = await supabase
      .from('GroupMcqAttempt')
      .select('topicScores, percentage, testId')
      .eq('groupId', groupId)
      .eq('userId', user.id);

    // Fetch student's submissions and missing requirements
    const { data: mySubmissions } = await supabase
      .from('GroupAssignmentSubmission')
      .select('assignmentId, qualityScore, reviewResult')
      .eq('groupId', groupId)
      .eq('userId', user.id);

    const studentTopicStats: Record<string, { totalScore: number; count: number; lowestPercentage: number }> = {};

    (myAttempts || []).forEach((att: any) => {
      if (att.topicScores && typeof att.topicScores === 'object') {
        Object.entries(att.topicScores).forEach(([tName, data]: [string, any]) => {
          const p = Number(data.percentage) || 0;
          if (!studentTopicStats[tName]) {
            studentTopicStats[tName] = { totalScore: 0, count: 0, lowestPercentage: p };
          }
          studentTopicStats[tName].totalScore += p;
          studentTopicStats[tName].count++;
          studentTopicStats[tName].lowestPercentage = Math.min(studentTopicStats[tName].lowestPercentage, p);
        });
      }
    });

    const weakTopics = Object.entries(studentTopicStats)
      .map(([topic, stats]) => {
        const avg = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
        return { topic, averageScore: avg };
      })
      .filter((t) => t.averageScore < 75)
      .sort((a, b) => a.averageScore - b.averageScore);

    const studentRecommendations = weakTopics.map((item) => {
      const matchingMaterials = availableMaterials.filter(
        (m) =>
          m.topic.toLowerCase().includes(item.topic.toLowerCase()) ||
          m.subject.toLowerCase().includes(item.topic.toLowerCase()) ||
          item.topic.toLowerCase().includes(m.topic.toLowerCase())
      );

      const topMat = matchingMaterials[0] || availableMaterials[0] || null;

      return {
        topic: item.topic,
        proficiencyScore: item.averageScore,
        status: item.averageScore < 50 ? 'Needs Urgent Attention' : 'Needs Practice',
        recommendedMaterial: topMat
          ? {
              id: topMat.id,
              title: topMat.title,
              subject: topMat.subject,
              unit: topMat.unit,
              chapter: topMat.chapter,
            }
          : null,
        suggestedActions: [
          {
            label: `Review ${topMat ? topMat.unit : 'Classroom Notes'} on ${item.topic}`,
            action: 'ask',
            query: `Explain ${item.topic} from ${topMat ? topMat.unit : 'notes'} in detail`,
          },
          {
            label: `Take 10-Question Practice Test on ${item.topic}`,
            action: 'generate-mcq',
            query: item.topic,
          },
          {
            label: `Generate Viva Questions for ${item.topic}`,
            action: 'generate-viva',
            query: item.topic,
          },
          {
            label: `Summarize Key Exam Points for ${item.topic}`,
            action: 'summarize',
            query: item.topic,
          },
        ],
      };
    });

    // Check assignment improvements
    const assignmentAdvice: string[] = [];
    (mySubmissions || []).forEach((sub: any) => {
      const res = sub.reviewResult;
      if (res && Array.isArray(res.missingRequirements) && res.missingRequirements.length > 0) {
        res.missingRequirements.forEach((req: string) => {
          assignmentAdvice.push(req);
        });
      }
    });

    return NextResponse.json({
      role: 'STUDENT',
      recommendations: studentRecommendations,
      assignmentAdvice: Array.from(new Set(assignmentAdvice)),
      totalEvaluatedTopics: Object.keys(studentTopicStats).length,
    });
  } catch (err: any) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate recommendations' }, { status: 500 });
  }
}
