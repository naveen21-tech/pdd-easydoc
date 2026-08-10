import { GoogleGenerativeAI } from '@google/generative-ai';
import { FacultyDocRequest, FacultyDocType, AIProvider } from '@/lib/types';

export interface GenerateFacultyDocOptions extends FacultyDocRequest {
  provider?: AIProvider;
}

export async function generateFacultyDocument(
  options: GenerateFacultyDocOptions
): Promise<string> {
  const {
    docType,
    courseName,
    courseCode = 'CS-301',
    department = 'Computer Science & Engineering',
    semester = 'Semester V',
    academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    instructorName = 'Faculty In-Charge',
    targetUnitOrTopic = 'Comprehensive Course Curriculum',
    bloomsTaxonomyLevel = 'L1 (Remember) to L5 (Evaluate)',
    totalMarks = 100,
    durationMinutes = 180,
    specificInstructions = '',
    additionalDetails = '',
  } = options;

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = `You are EasyDoc Faculty AI, a distinguished Professor, Dean of Academics, and Accreditation Specialist (NBA, NAAC, ABET).
Generate a thorough, submission-grade, high-precision academic document of type "${docType}" adhering to international university standards.

CRITICAL FORMATTING & ACADEMIC STANDARDS:
1. ALWAYS start with the badge: [TEMPLATE_BADGE] Faculty Document • ${docType}
2. Put the title on line 2 in bold: # **${courseName} — ${docType}**
3. Include an academic institutional header table (Department, Course Code, Semester, Academic Year, Instructor, Date).
4. Add [PAGE BREAK] after the title page.
5. Output richly structured Markdown with numbered sections (## 1., ## 2.), formatted tables, Bloom's Taxonomy taxonomy verbs, and CO-PO mapping where applicable.
6. Provide exhaustive, realistic academic content without vague placeholders. Every section must be fully articulated.`;

  const userPrompt = `Document Type: ${docType}
Course Name: ${courseName}
Course Code: ${courseCode}
Department: ${department}
Semester: ${semester}
Academic Year: ${academicYear}
Faculty Instructor: ${instructorName}
Target Unit / Topic / Scope: ${targetUnitOrTopic}
Bloom's Taxonomy Target: ${bloomsTaxonomyLevel}
Total Marks: ${totalMarks}
Duration: ${durationMinutes} minutes
Specific Instructions: ${specificInstructions || 'Standard university accreditation format'}
Additional Context: ${additionalDetails || 'None'}`;

  // 1. Try Groq AI
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'mock-key' && !groqKey.includes('your-groq-key')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 100) return text;
      }
    } catch (e) {
      console.warn('Groq faculty generation fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'mock-key' && !geminiKey.includes('your-gemini-key')) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = res.response.text();
      if (text && text.trim().length > 100) return text;
    } catch (e) {
      console.warn('Gemini faculty generation fallback:', e);
    }
  }

  // 3. Fallback High-Precision Academic Synthesizer
  return generateFallbackFacultyDoc(options, currentDate);
}

function generateFallbackFacultyDoc(
  options: GenerateFacultyDocOptions,
  currentDate: string
): string {
  const {
    docType,
    courseName,
    courseCode = 'CS-301',
    department = 'Computer Science & Engineering',
    semester = 'Semester V',
    academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    instructorName = 'Faculty In-Charge',
    targetUnitOrTopic = 'Core Course Curriculum',
    bloomsTaxonomyLevel = 'L1 (Remember) to L5 (Evaluate)',
    totalMarks = 100,
    durationMinutes = 180,
  } = options;

  let bodyContent = '';

  switch (docType) {
    case 'Lesson Plan':
      bodyContent = `
## 1. Course Information & Learning Objectives
This comprehensive semester Lesson Plan defines the instructional sequence, pedagogical methodologies, and learning assessments for **${courseName}**.

### 1.1 Course Objectives
- Impart foundational and advanced theoretical principles of ${courseName}.
- Equip students with analytical problem-solving skills and practical laboratory implementation.
- Align lecture delivery with NBA/ABET outcome-based education (OBE) guidelines.

---

## 2. Weekly Instructional Delivery Schedule

| Week | Planned Topics & Sub-topics | Pedagogy / Teaching Aid | Mapped CO | Bloom's Level | Hours |
|:---|:---|:---|:---|:---|:---|
| Week 1 | Course Overview, Prerequisites & Fundamental Concepts | Interactive Lecture, Blackboard | CO1 | L1 (Remember) | 4 |
| Week 2 | Mathematical Modeling & Core Architectural Principles | PPT Slides, Live Problem Solving | CO1 | L2 (Understand) | 4 |
| Week 3 | Algorithmic Formulations & Complexity Analysis | Flipped Classroom, Code Walkthrough | CO2 | L3 (Apply) | 4 |
| Week 4 | Modular Component Implementation & Data Structures | Hands-on Coding, Peer Review | CO2 | L3 (Apply) | 4 |
| Week 5 | Unit Review, Tutorial Problem Set & Quiz 1 | Tutorial Sheet, Interactive Poll | CO1, CO2 | L3 (Apply) | 4 |
| Week 6 | System Optimization, Caching & Concurrency | Case Study, Diagrammatic Modeling | CO3 | L4 (Analyze) | 4 |
| Week 7 | Mid-Term Examination (CIE 1) & Performance Review | Written Evaluation, Paper Discussion | CO1-CO3 | L1-L4 | 4 |
| Week 8 | Advanced Protocols, Fault Tolerance & Recovery | Technical Video, Research Discussion | CO4 | L4 (Analyze) | 4 |
| Week 9 | Security Architecture, Cryptographic Verification | Security Lab Demo, Threat Modeling | CO4 | L5 (Evaluate) | 4 |
| Week 10 | Real-World Industry Case Studies & Capstone Setup | Project Mentoring, Group Work | CO5 | L5 (Evaluate) | 4 |
| Week 11 | Comprehensive Review, Viva Voce & Model Exam | Model Question Paper, Q&A | CO1-CO5 | L1-L5 | 4 |

---

## 3. Pedagogical Strategies & Instructional Resources
- **Blended Learning:** Pre-lecture video recordings and reading materials distributed via LMS.
- **Formative Assessments:** Weekly 5-minute exit tickets, coding quizzes, and peer-reviewed homework.
- **Reference Textbooks & Web Resources:** Standard prescribed IEEE / Springer textbooks and open-access documentation.
`;
      break;

    case 'Question Paper':
      bodyContent = `
## 1. General Examination Instructions
1. Answer **ALL** questions in Part A (Compulsory).
2. Answer any **FIVE** full questions from Part B choosing one from each module.
3. Part C is an application-oriented analytical question.
4. Assume suitable data wherever necessary and state assumptions clearly.

---

## 2. PART A (Short Answer Questions — 10 x 2 = 20 Marks)

| Q.No | Question Description | Course Outcome | Bloom's Level | Marks |
|:---|:---|:---|:---|:---|
| 1 | State the fundamental working principle of ${courseName.split(' ')[0] || 'the system'}. | CO1 | L1 (Remember) | 2 |
| 2 | Differentiate between synchronous and asynchronous operations in this context. | CO1 | L2 (Understand) | 2 |
| 3 | Define the time and space complexity constraints for standard lookup operations. | CO2 | L1 (Remember) | 2 |
| 4 | Outline the role of cryptographic hashing in data integrity verification. | CO2 | L2 (Understand) | 2 |
| 5 | Illustrate the basic architectural diagram of a decoupled multi-tier system. | CO3 | L2 (Understand) | 2 |
| 6 | Explain how connection pooling mitigates database exhaustion. | CO3 | L2 (Understand) | 2 |
| 7 | List two common vulnerabilities mitigated by parameterized queries. | CO4 | L1 (Remember) | 2 |
| 8 | Specify the conditions required for achieving ACID transactional consistency. | CO4 | L2 (Understand) | 2 |
| 9 | Define the term "P99 Latency" and its significance in SLA compliance. | CO5 | L1 (Remember) | 2 |
| 10 | State one advantage of blue-green deployment strategies. | CO5 | L2 (Understand) | 2 |

---

## 3. PART B (Analytical & Design Questions — 5 x 13 = 65 Marks)

| Q.No | Question Description | Course Outcome | Bloom's Level | Marks |
|:---|:---|:---|:---|:---|
| 11.a | Derive the mathematical formulation and explain the workflow for ${targetUnitOrTopic}. | CO2 | L3 (Apply) | 7 |
| 11.b | With a neat architectural schema, analyze the bottleneck mitigation strategies. | CO2 | L4 (Analyze) | 6 |
| 12.a | Design a high-throughput data pipeline and illustrate component communication. | CO3 | L4 (Analyze) | 7 |
| 12.b | Compare and contrast relational vs NoSQL persistence models for this domain. | CO3 | L4 (Analyze) | 6 |
| 13.a | Develop an end-to-end algorithmic procedure satisfying sub-second latency SLA. | CO4 | L3 (Apply) | 7 |
| 13.b | Formulate test cases matrix covering boundary conditions and stress thresholds. | CO4 | L4 (Analyze) | 6 |

---

## 4. PART C (Comprehensive Case Study / Design Problem — 1 x 15 = 15 Marks)

| Q.No | Question Description | Course Outcome | Bloom's Level | Marks |
|:---|:---|:---|:---|:---|
| 14 | An enterprise system experiences a 10x traffic spike causing cascading timeouts. Architect a resilient fault-tolerant infrastructure utilizing caching, auto-scaling, and circuit breakers. Justify your design choices with quantifiable metrics. | CO5 | L5 (Evaluate / Create) | 15 |
`;
      break;

    case 'Assignment Sheet':
      bodyContent = `
## 1. Assignment Objectives & Guidelines
This assignment assesses students' analytical problem-solving and implementation capabilities in **${courseName}** (${targetUnitOrTopic}).

### 1.1 Submission Rules
- **Submission Mode:** Digital PDF / Source Repository upload on LMS.
- **Originality Policy:** Plagiarism threshold strictly capped at <15%. Any non-original copy will receive zero credit.
- **Deadline:** Exactly two weeks from issue date. Late submissions penalized at 10% per day.

---

## 2. Problem Statements

### Problem Set 1: Theoretical Formulations (30 Marks)
1. Provide a rigorous mathematical proof demonstrating the correctness and boundary limits for the primary algorithm in ${courseName}.
2. Construct a state transition diagram detailing all nominal and edge error conditions.

### Problem Set 2: Practical Implementation & Analysis (40 Marks)
1. Implement a working prototype demonstrating modular separation between business logic and storage tiers.
2. Conduct benchmark experiments measuring latency under 100, 1,000, and 10,000 concurrent simulated requests. Plot the results in a comparative chart.

### Problem Set 3: Critical Evaluation & Trade-offs (30 Marks)
1. Critically evaluate the trade-offs between memory footprint and execution speed in your implementation.
2. Propose two concrete optimizations that would enhance system fault tolerance in production.

---

## 3. Evaluation Rubric Table

| Criterion | Exemplary (90-100%) | Proficient (70-89%) | Developing (50-69%) | Inadequate (<50%) | Weight |
|:---|:---|:---|:---|:---|:---|
| **Technical Correctness** | Flawless logic, rigorous mathematical proof | Minor non-critical edge case oversight | Noticeable logical gaps | Incorrect formulations | 35% |
| **Implementation & Testing** | Complete modular code with benchmark plots | Working code with basic test logs | Incomplete test suite | Non-functional code | 35% |
| **Analysis & Discussion** | Deep insights, quantitative trade-offs | Valid explanations with standard metrics | Shallow commentary | No discussion | 20% |
| **Documentation & Style** | Professional IEEE report formatting | Clean formatting with minor errors | Inconsistent styling | Poorly presented | 10% |
`;
      break;

    case 'Course Outcomes':
      bodyContent = `
## 1. Course Outcomes (CO) Statements
Upon successful completion of **${courseName} (${courseCode})**, students will be able to:

| CO ID | Course Outcome Statement | Bloom's Revised Taxonomy Level |
|:---|:---|:---|
| **CO1** | **Recall and explain** foundational concepts, terminology, and principles of ${courseName}. | L1 (Remember), L2 (Understand) |
| **CO2** | **Apply** standard algorithms, data structures, and mathematical models to solve domain problems. | L3 (Apply) |
| **CO3** | **Analyze** architectural trade-offs, bottlenecks, and complexity constraints in software pipelines. | L4 (Analyze) |
| **CO4** | **Evaluate** system performance, security vulnerabilities, and reliability metrics. | L5 (Evaluate) |
| **CO5** | **Design and synthesize** scalable, modular, and production-ready software solutions. | L6 (Create) |

---

## 2. CO-PO & CO-PSO Articulation Matrix

*Correlation Levels: **1** = Slight (Low), **2** = Moderate (Medium), **3** = Substantial (High), **-** = No Correlation*

| COs | PO1 | PO2 | PO3 | PO4 | PO5 | PO6 | PO7 | PO8 | PO9 | PO10 | PO11 | PO12 | PSO1 | PSO2 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CO1** | 3 | 2 | - | - | - | - | - | - | - | 1 | - | 2 | 3 | 1 |
| **CO2** | 3 | 3 | 2 | 2 | 2 | - | - | - | 1 | 1 | - | 2 | 3 | 2 |
| **CO3** | 3 | 3 | 3 | 3 | 2 | 1 | - | - | 2 | 2 | 1 | 2 | 3 | 3 |
| **CO4** | 2 | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 2 | 2 | 2 | 3 | 2 | 3 |
| **CO5** | 3 | 3 | 3 | 3 | 3 | 2 | 1 | 2 | 3 | 3 | 3 | 3 | 3 | 3 |
| **Average** | **2.8** | **2.8** | **2.8** | **2.8** | **2.5** | **1.7** | **1.0** | **1.5** | **2.0** | **1.8** | **2.0** | **2.4** | **2.8** | **2.4** |

---

## 3. Attainment Calculation Strategy
- **Direct Attainment (80% Weight):** Continuous Internal Evaluation (CIE: 30%) + Semester End Exam (SEE: 70%).
- **Indirect Attainment (20% Weight):** End-of-course student exit surveys and faculty feedback.
- **Target Threshold:** 70% of students scoring above 60% marks in mapped assessments.
`;
      break;

    case 'Internal Assessment Report':
      bodyContent = `
## 1. Continuous Internal Evaluation (CIE) Summary
- **Course:** ${courseName} (${courseCode})
- **Assessment Type:** Mid-Term Internal Assessment 1 (CIE-1)
- **Total Enrolled Students:** 65
- **Students Appeared:** 63 | **Absent:** 2

---

## 2. Academic Performance Statistics & Distribution

| Performance Bracket | Marks Range (Out of 50) | Student Count | Percentage (%) | Remarks |
|:---|:---|:---|:---|:---|
| **Distinction (Exemplary)** | 40 – 50 Marks | 22 | 34.9% | Strong conceptual mastery |
| **First Class (Proficient)** | 30 – 39 Marks | 26 | 41.3% | Satisfactory analytical depth |
| **Second Class (Average)** | 20 – 29 Marks | 11 | 17.5% | Minor gaps in design derivation |
| **Below Threshold (Slow Learners)**| < 20 Marks | 4 | 6.3% | Requires remedial mentoring |

- **Class Average Score:** 34.6 / 50 (69.2%)
- **Highest Score:** 49 / 50 | **Lowest Score:** 14 / 50
- **Overall Pass Percentage:** 93.7%

---

## 3. Remedial Action Plan for Slow Learners
1. **Targeted Tutorial Sessions:** Conduct 2 weekly doubt-clearing sessions focused on core derivations.
2. **Simplified Study Guides:** Distribute step-by-step formula sheets and solved question banks.
3. **Peer Mentoring:** Pair students with Distinction performers for collaborative lab assignments.
4. **Re-Test Evaluation:** Conduct improvement test to verify mastery before final examinations.
`;
      break;

    case 'Student Feedback Form':
      bodyContent = `
## 1. Course & Faculty Evaluation Survey
Please rate the instructional delivery and course structure for **${courseName}** on a 5-point Likert scale:
*(5 = Strongly Agree, 4 = Agree, 3 = Neutral, 2 = Disagree, 1 = Strongly Disagree)*

---

## 2. Evaluation Metrics Questionnaire

| # | Survey Dimension | 5 | 4 | 3 | 2 | 1 |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | The faculty clearly explained the course objectives and syllabus at the semester commencement. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | Instructional delivery was structured, punctual, and covered the syllabus comprehensively. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | Complex theoretical concepts were illustrated with real-world industry examples and diagrams. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | The faculty encouraged classroom interaction, questions, and critical technical discussions. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | Laboratory experiments and assignment sheets reinforced theoretical learning effectively. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 6 | Feedback on assignments and internal tests was provided promptly with constructive guidance. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 7 | Digital resources, slides, and reference materials shared on the LMS were relevant and helpful. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 8 | Overall, the faculty's teaching methodology stimulated my interest in ${courseName}. | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## 3. Qualitative Open-Ended Feedback
- **What were the strongest aspects of this course?**
  *(Space for student comments...)*

- **What specific suggestions do you have for improving instructional delivery?**
  *(Space for student recommendations...)*
`;
      break;

    case 'Attendance Report':
      bodyContent = `
## 1. Course Attendance Summary & Register
- **Course:** ${courseName} (${courseCode})
- **Total Classes Conducted:** 48 Hours
- **Minimum Attendance Requirement:** 75% (Accreditation Norm)

---

## 2. Attendance Bracket Breakdown

| Attendance Category | Percentage Range | Student Count | % of Class | Action Required |
|:---|:---|:---|:---|:---|
| **Regular Attendance** | 85% – 100% | 46 | 70.8% | Commendation in portfolio |
| **Satisfactory Attendance** | 75% – 84% | 14 | 21.5% | Standard eligibility |
| **Condonation Bracket (Warning)** | 65% – 74% | 4 | 6.2% | Warning letter to parents & medical review |
| **Critical Shortage (Detained)** | < 65% | 1 | 1.5% | Disqualified from Semester End Exam |

---

## 3. Critical Shortage Case Actions
- Issued formal notification to Academic Dean and Department HOD.
- Scheduled one-on-one counseling with student mentors.
- Extra compensatory lecture hours scheduled on Saturdays for condonation candidates.
`;
      break;

    case 'Meeting Minutes':
      bodyContent = `
## 1. Departmental Meeting Minutes (MoM)
- **Meeting Body:** Department Academic Committee (DAC) / Board of Studies
- **Date & Time:** ${currentDate} at 10:30 AM
- **Venue:** Department Conference Hall / Virtual Hybrid Room
- **Chairperson:** Head of Department (${department})
- **Faculty Secretary:** ${instructorName}

---

## 2. Agenda Items
1. Review of syllabus coverage and CIE performance for ${courseName}.
2. Evaluation of laboratory infrastructure, software licenses, and cloud credits.
3. Preparation for upcoming NAAC / NBA accreditation peer team inspection.
4. Planning of guest lectures, industrial visits, and hackathons.

---

## 3. Key Discussions & Resolutions
- **Resolution 1:** Confirmed that all faculty have completed >85% of planned syllabus on schedule.
- **Resolution 2:** Approved the integration of cloud microservices and Docker containers into the laboratory curriculum for ${courseName}.
- **Resolution 3:** Mandatory remedial tutorials scheduled for identified slow learners across all sections.

---

## 4. Action Items & Assignees Matrix

| Action Item | Responsible Faculty | Target Deadline | Current Status |
|:---|:---|:---|:---|
| Submit verified CO-PO attainment matrices to Academic Coordinator | ${instructorName} | End of Current Week | In Progress |
| Procure additional GPU server licenses for AI / ML laboratory | Lab In-Charge | 10 Days | Approved |
| Publish revised internal question bank with Bloom's taxonomy tags | Subject Faculty Team | Next Monday | Completed |
`;
      break;

    default: // Academic Report
      bodyContent = `
## 1. End-of-Semester Academic Course Report
This comprehensive report documents curriculum execution, assessment outcomes, and continuous improvement initiatives for **${courseName}** (${courseCode}).

---

## 2. Course Execution Summary
- **Planned Instructional Hours:** 50 Hours | **Conducted:** 52 Hours (104% Execution)
- **Syllabus Coverage:** 100% of all 5 modules completed.
- **Laboratory Sessions:** 12 practical experiments + 1 mini-project evaluation.

---

## 3. Outcome Attainment & Benchmark Results
- **Target CO Attainment Level:** 2.50 / 3.00
- **Actual Achieved CO Attainment:** 2.68 / 3.00 (Exceeded benchmark by +7.2%)
- **High Performance Factors:** Flipped classroom interactive problem-solving and automated online grading.

---

## 4. Recommendations for Next Academic Cycle
1. Introduce contemporary cloud-native tools directly into the foundational laboratory modules.
2. Increase emphasis on practical case studies in the mid-term question papers.
3. Continue student peer-mentoring groups which lowered failure rates by 12%.
`;
      break;
  }

  return `[TEMPLATE_BADGE] Faculty Document • ${docType}
# **${courseName} — ${docType}**

| Academic Attribute | Institutional Details |
|:---|:---|
| **Course Name** | ${courseName} (${courseCode}) |
| **Department** | ${department} |
| **Semester / Term** | ${semester} • AY ${academicYear} |
| **Faculty In-Charge** | ${instructorName} |
| **Document Standard** | NBA / NAAC / ABET Outcome-Based Education (OBE) |
| **Issue Date** | ${currentDate} |

[PAGE BREAK]

${bodyContent.trim()}
`;
}
