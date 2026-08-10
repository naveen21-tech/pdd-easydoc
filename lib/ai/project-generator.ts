import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProjectModuleItem, AIProvider } from '@/lib/types';

export interface GenerateProjectDocsOptions {
  projectName: string;
  projectDomain: string;
  projectDescription: string;
  problemStatement?: string;
  objectives?: string;
  targetUsers?: string;
  techStack: {
    languages: string[];
    frameworks: string[];
    database: string[];
    tools: string[];
  };
  modules: ProjectModuleItem[];
  selectedDocTypes: string[];
  provider?: AIProvider;
}

export interface GeneratedDocArtifact {
  title: string;
  docType: string;
  content: string;
}

export async function generateProjectDocumentation(
  options: GenerateProjectDocsOptions
): Promise<GeneratedDocArtifact[]> {
  const artifacts: GeneratedDocArtifact[] = [];

  for (const docType of options.selectedDocTypes) {
    const content = await generateSingleProjectDocument(docType, options);
    artifacts.push({
      title: `${options.projectName} — ${docType}`,
      docType,
      content,
    });
  }

  return artifacts;
}

async function generateSingleProjectDocument(
  docType: string,
  options: GenerateProjectDocsOptions
): Promise<string> {
  const { projectName, projectDomain, projectDescription, problemStatement, objectives, targetUsers, techStack, modules } = options;
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = `You are EasyDoc Enterprise AI, a principal software architect and technical writer.
Generate an exhaustive, highly structured, professional ${docType} for software engineering standards.
Rules:
1. ALWAYS start with the badge: [TEMPLATE_BADGE] ${docType}
2. Put the title on line 2 in bold: # **${projectName} — ${docType}**
3. Include a decorated metadata header (Domain: ${projectDomain}, Date: ${currentDate}, Version: 1.0.0, Status: Approved).
4. Add [PAGE BREAK] after the title page.
5. Provide detailed, numbered sections (## 1., ## 2., etc.), rich tables, bulleted specifications, and code/schema blocks where appropriate.
6. Make it thorough, comprehensive, and immediately ready for submission to engineering leads or academic review committees.`;

  const userPrompt = `Project Name: ${projectName}
Domain: ${projectDomain}
Description: ${projectDescription}
Problem Statement: ${problemStatement || 'Not specified'}
Objectives: ${objectives || 'Not specified'}
Target Users: ${targetUsers || 'Not specified'}

Tech Stack:
- Languages: ${(techStack.languages || []).join(', ') || 'TypeScript, Python'}
- Frameworks: ${(techStack.frameworks || []).join(', ') || 'Next.js, React, Node.js'}
- Database: ${(techStack.database || []).join(', ') || 'PostgreSQL, Supabase'}
- Tools: ${(techStack.tools || []).join(', ') || 'Docker, Git, VS Code, Vercel'}

Modules Identified:
${(modules || []).map((m, i) => `${i + 1}. **${m.name}** (${m.userRole}): ${m.description} [Features: ${(m.features || []).join(', ')}]`).join('\n')}

DOCUMENT TO GENERATE: "${docType}"
Provide full specifications tailored strictly to the above project and modules.`;

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
      console.warn('Groq generation fallback for project doc:', e);
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
      console.warn('Gemini fallback for project doc:', e);
    }
  }

  // 3. Fallback High-Quality Synthesizer
  return generateFallbackProjectDoc(docType, options, currentDate);
}

function generateFallbackProjectDoc(
  docType: string,
  options: GenerateProjectDocsOptions,
  currentDate: string
): string {
  const { projectName, projectDomain, projectDescription, problemStatement, objectives, targetUsers, techStack, modules } = options;

  let bodyContent = '';

  switch (docType) {
    case 'SRS':
      bodyContent = `
## 1. Introduction & Scope
This Software Requirements Specification (SRS) establishes the complete functional, performance, and security requirements for **${projectName}** in the ${projectDomain} domain.

### 1.1 Purpose
The purpose of this document is to provide a detailed, unambiguous specification of all features and architectural constraints governing ${projectName}.

### 1.2 Target Audience & Stakeholders
- Primary Users: ${targetUsers || 'End-users, System Operators, and Developers'}
- System Administrators & QA Engineers
- Academic and Technical Review Committee

---

## 2. Overall Description & Product Perspective
${projectName} is an advanced software platform designed to address critical workflow bottlenecks:
> **Problem Statement:** ${problemStatement || 'Eliminate inefficiencies through automated, secure software workflows.'}

### 2.1 Project Objectives
${objectives || '- Achieve sub-second latency and 99.9% uptime\n- Implement modular, scalable multi-tier architecture\n- Provide strict role-based access control'}

---

## 3. Module & Functional Specifications

${modules.map((m, idx) => `
### 3.${idx + 1} Module: ${m.name}
- **Target Role:** ${m.userRole || 'All Users'}
- **Description:** ${m.description}
- **Key Features:**
${(m.features || []).map((f) => `  - [REQ-F${idx + 1}.${f.replace(/\s+/g, '')}]: ${f}`).join('\n')}
- **Acceptance Criteria:** Must validate inputs, return standard JSON payloads, and execute within <300ms SLA.
`).join('\n')}

---

## 4. Non-Functional Requirements (NFR)
| Requirement ID | Category | Specification Criteria | Verification Method |
|:---|:---|:---|:---|
| NFR-01 | Performance | Sub-500ms p95 API response times under standard load | Automated Stress Testing |
| NFR-02 | Security | AES-256 payload encryption & HTTPS TLS 1.3 | Security Audit & ZAP Scan |
| NFR-03 | Availability | 99.95% annual uptime with automated container recovery | Uptime Monitor |
| NFR-04 | Usability | Responsive mobile & desktop interface satisfying WCAG 2.1 AA | User Acceptance Testing |
`;
      break;

    case 'System Architecture':
    case 'Software Design Document':
      bodyContent = `
## 1. Architectural Strategy & Design Patterns
**${projectName}** is architected using a decoupled, multi-tiered topology ensuring high maintainability, fault tolerance, and horizontal scalability.

### 1.1 Architectural Tiers
1. **Presentation Layer:** Next.js 14 App Router, React 18, Tailwind CSS with server-side rendering.
2. **Application & API Layer:** RESTful edge endpoints, middleware session validation, and asynchronous workers.
3. **Data & Storage Tier:** ${techStack.database?.join(', ') || 'PostgreSQL with connection pooling'}.

---

## 2. Technology Stack Breakdown
- **Languages:** ${techStack.languages?.join(', ') || 'TypeScript, Python, SQL'}
- **Frameworks:** ${techStack.frameworks?.join(', ') || 'Next.js, React, Node.js'}
- **Databases:** ${techStack.database?.join(', ') || 'PostgreSQL, Supabase'}
- **DevOps & Tooling:** ${techStack.tools?.join(', ') || 'Docker, Git, Vercel'}

---

## 3. Component Interaction & Sequence
\`\`\`
[ Client Browser ] ---> [ Edge CDN / Next.js Proxy ]
                               |
                               v
                     [ Auth & Middleware Guard ]
                               |
                               +---> [ Core API Controllers ]
                                           |
                                           v
                              [ Prisma ORM / DB Pool ]
                                           |
                                           v
                             [ PostgreSQL Database ]
\`\`\`

---

## 4. Module Subsystem Breakdown
${modules.map((m, idx) => `
### 4.${idx + 1} Subsystem: ${m.name}
- **Role:** ${m.userRole}
- **Operational Scope:** ${m.description}
- **Core Interfaces:** Handles ${m.features.join(', ')} with transaction safety.
`).join('\n')}
`;
      break;

    case 'Database Design':
      bodyContent = `
## 1. Database Overview & Schema Design
The data persistence layer for **${projectName}** is built on relational database standards in Third Normal Form (3NF).

### 1.1 Entity-Relationship (ER) Overview
- Primary Entities: Users, Profiles, Sessions, Projects, Documents, Notifications.
- Foreign Key Constraints enforce referential integrity across all related tables.

---

## 2. Schema Specification & Tables

### 2.1 Core Entities Table
| Table Name | Primary Key | Foreign Keys | Purpose |
|:---|:---|:---|:---|
| \`users\` | \`id\` (UUID) | None | Core user identity & Supabase auth linking |
| \`projects\` | \`id\` (UUID) | \`user_id\` -> \`users.id\` | Parent project workspaces |
| \`documents\` | \`id\` (UUID) | \`project_id\` -> \`projects.id\` | Generated Markdown & PDF artifacts |
| \`modules\` | \`id\` (UUID) | \`project_id\` -> \`projects.id\` | Identified project feature modules |

---

## 3. Data Integrity & Indexing Strategy
- **B-Tree Indexes:** Created on \`user_id\`, \`project_id\`, and \`created_at\` for sub-10ms lookup queries.
- **Transactions:** Atomic ACID guarantees for multi-document creation and deletions.
`;
      break;

    case 'API Documentation':
      bodyContent = `
## 1. RESTful API Guidelines & Standards
All API endpoints for **${projectName}** return standardized JSON responses and require HTTP Bearer / Session cookie authentication.

---

## 2. Core API Endpoints

### 2.1 Projects Endpoint
- **URL:** \`/api/projects\`
- **Method:** \`GET\` | \`POST\`
- **Headers:** \`Content-Type: application/json\`
- **Sample Request (POST):**
\`\`\`json
{
  "name": "${projectName}",
  "domain": "${projectDomain}",
  "description": "${projectDescription.slice(0, 100)}..."
}
\`\`\`
- **Response (200 OK):**
\`\`\`json
{
  "success": true,
  "projectId": "proj-uuid-1234",
  "status": "ACTIVE"
}
\`\`\`

---

## 3. Module Operations
${modules.map((m, idx) => `
### 3.${idx + 1} Module Endpoint: \`/api/${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`
- **Method:** \`POST\`
- **Description:** Executes operations for ${m.features.join(', ')}.
- **Access Level:** ${m.userRole}
`).join('\n')}
`;
      break;

    case 'Test Cases':
      bodyContent = `
## 1. Test Strategy & Verification Matrix
This document establishes the comprehensive unit, integration, and user acceptance test cases for **${projectName}**.

---

## 2. Test Cases Matrix

| Test ID | Module | Test Scenario | Preconditions | Expected Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-001 | Auth | User registration with valid credentials | User on /signup | User account created, redirected to dashboard | PASS |
| TC-002 | Auth | User login with invalid password | User on /login | Error alert displayed, access denied | PASS |
| TC-003 | Modules | Execution of ${modules[0]?.name || 'Core Module'} | Authenticated session | Module output rendered within <500ms | PASS |
| TC-004 | Export | PDF generation of project document | Document exists | Clean binary PDF downloaded with no layout shift | PASS |
| TC-005 | Security | Unauthorized API access without token | Unauthenticated user | HTTP 401 Unauthorized returned | PASS |

---

## 3. Automated Testing Criteria
- Code coverage target: >80% unit test coverage.
- Continuous Integration: Automated test suite executed on every GitHub pull request.
`;
      break;

    default:
      bodyContent = `
## 1. Executive Summary
**${projectName}** is a comprehensive software engineering project in the ${projectDomain} domain designed to deliver high reliability, modular component architecture, and modern developer ergonomics.

---

## 2. Project Scope & Architecture
- **Domain:** ${projectDomain}
- **Overview:** ${projectDescription}
- **Objectives:** ${objectives || 'Deliver high-performance, maintainable software systems.'}

---

## 3. Module Breakdown
${modules.map((m, idx) => `
### 3.${idx + 1} ${m.name}
- **Target Role:** ${m.userRole}
- **Functionality:** ${m.description}
- **Components:** ${m.features.join(', ')}
`).join('\n')}

---

## 4. Conclusion & Operational Readiness
The project satisfies all architectural, performance, and testing standards and is verified for production deployment.
`;
      break;
  }

  return `[TEMPLATE_BADGE] ${docType}
# **${projectName} — ${docType}**

| Project Attribute | Specification Details |
|:---|:---|
| **Project Name** | ${projectName} |
| **Domain** | ${projectDomain} |
| **Release Version** | 1.0.0 (Production) |
| **Generated Date** | ${currentDate} |
| **Platform** | EasyDoc Project Studio |

[PAGE BREAK]

${bodyContent.trim()}
`;
}
