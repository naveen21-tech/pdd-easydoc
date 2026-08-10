import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProjectItem, ProjectModuleItem, AIProvider } from '@/lib/types';

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
- Languages: ${techStack.languages.join(', ') || 'TypeScript, Python'}
- Frameworks: ${techStack.frameworks.join(', ') || 'Next.js, React, Node.js'}
- Database: ${techStack.database.join(', ') || 'PostgreSQL, Supabase'}
- Tools: ${techStack.tools.join(', ') || 'Docker, Git, VS Code, Vercel'}

Modules Identified:
${modules.map((m, i) => `${i + 1}. **${m.name}** (${m.userRole}): ${m.description} [Features: ${m.features.join(', ')}]`).join('\n')}

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
          temperature: 0.6,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
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
      if (text) return text;
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
    case 'Software Requirements Specification':
      bodyContent = `
## 1. Introduction & Project Scope
### 1.1 Purpose
This Software Requirements Specification (SRS) outlines the functional, operational, and non-functional requirements for **${projectName}** in the **${projectDomain}** sector.

### 1.2 Target Audience
${targetUsers || 'Developers, system evaluators, enterprise end-users, and project managers.'}

---

## 2. Overall Description & User Perspectives
- **Product Perspective:** High-efficiency web application designed to solve: *${problemStatement || projectDescription}*
- **Primary Objectives:** ${objectives || 'Provide robust, scalable software workflow capabilities.'}

---

## 3. Detailed Functional Requirements by Module

${modules.map((m, idx) => `### 3.${idx + 1} Module: ${m.name}
- **Assigned User Role:** ${m.userRole || 'Standard User'}
- **Module Purpose:** ${m.description}
- **Key Capabilities:**
${m.features.map((f) => `  - **FR-${idx + 1}.${f.replace(/\s+/g, '-').toLowerCase()}:** The system shall allow ${f}.`).join('\n') || '  - Standard CRUD workflows.'}
`).join('\n')}

---

## 4. Non-Functional Requirements (NFR)
| Requirement Category | Metric / Specification | Target Standard |
| :--- | :--- | :--- |
| **Performance** | API Response Latency | p95 < 250ms under normal load |
| **Availability** | Uptime SLA | 99.9% High Availability |
| **Security** | Authentication & Encryption | JWT / TLS 1.3 / AES-256 at Rest |
| **Usability** | Device Responsiveness | Fully responsive Mobile, Tablet, Desktop |
`;
      break;

    case 'System Architecture':
    case 'Software Design Document':
      bodyContent = `
## 1. Architectural Overview & Design Pattern
**${projectName}** adopts a modern multi-tiered Client-Server / Service-Oriented Architecture optimized for maintainability and horizontal scalability.

\`\`\`
+-------------------------------------------------------------+
|                      Client Layer (UI)                      |
|  [ ${techStack.frameworks[0] || 'Next.js 14'} / ${techStack.languages[0] || 'TypeScript'} / Tailwind CSS ]   |
+------------------------------+------------------------------+
                               | HTTPS / REST / SSE
+------------------------------v------------------------------+
|                     Application & API Layer                 |
|   - Authentication & Role Guards (RBAC)                     |
|   - Multi-Model AI Service Orchestrator                     |
|   - Document Synthesis & Exporter Micro-Engines             |
+------------------------------+------------------------------+
                               | TCP / Connection Pool
+------------------------------v------------------------------+
|                      Persistence Layer                      |
|   - Database: ${techStack.database.join(', ') || 'PostgreSQL'}                        |
|   - Object Storage: S3 / Supabase Storage                   |
+-------------------------------------------------------------+
\`\`\`

---

## 2. Technology Stack Rationale
- **Frontend & App Framework:** \`${techStack.frameworks.join(', ') || 'React, Next.js'}\` chosen for server-side rendering, sub-second routing, and enterprise DX.
- **Backend & Logic:** \`${techStack.languages.join(', ') || 'TypeScript, Node.js'}\` for end-to-end type safety.
- **Database Engine:** \`${techStack.database.join(', ') || 'PostgreSQL'}\` providing ACID compliance and relational integrity.
- **Tooling & CI/CD:** \`${techStack.tools.join(', ') || 'Git, Docker, Vercel'}\` for automated build verification.

---

## 3. Data Flow & Security Model
1. **Client Request:** Secure bearer tokens or HTTP-only cookies authenticate user sessions.
2. **Controller Middleware:** Validates payload schemas with Zod before processing.
3. **Database Transactions:** Executes isolated queries guarded by Row-Level Security (RLS).
`;
      break;

    case 'Database Design':
      bodyContent = `
## 1. Database Schema & Relational Model
The database for **${projectName}** is engineered on **${techStack.database[0] || 'PostgreSQL'}** utilizing third normal form (3NF) relational normalization.

---

## 2. Primary Tables & Entity Specifications

### Table: \`users\` / \`profiles\`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | UUID | PRIMARY KEY | Unique user account identifier |
| \`email\` | VARCHAR(255) | UNIQUE, NOT NULL | Account email address |
| \`role\` | VARCHAR(50) | DEFAULT 'USER' | Role-based permission level |
| \`created_at\` | TIMESTAMP | DEFAULT NOW() | Account registration timestamp |

${modules.map((m) => `### Table: \`${m.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | UUID | PRIMARY KEY | Record unique ID |
| \`user_id\` | UUID | FOREIGN KEY (users.id) | Author / Tenant reference |
| \`name\` | VARCHAR(255) | NOT NULL | Record title |
| \`payload\` | JSONB | NULLABLE | Structured operational attributes |
| \`created_at\` | TIMESTAMP | DEFAULT NOW() | Record creation date |
`).join('\n')}

---

## 3. Indexing & Optimization Strategy
- **B-Tree Indices:** Created on foreign keys (\`user_id\`) and timestamp columns for fast filtering.
- **Connection Pooling:** Configured with Prisma / PgBouncer to prevent connection exhaustion.
`;
      break;

    case 'API Documentation':
      bodyContent = `
## 1. REST API Overview & Conventions
- **Base URL:** \`https://api.${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/v1\`
- **Authentication:** \`Authorization: Bearer <JWT_TOKEN>\`
- **Content Type:** \`application/json\`

---

## 2. Core API Endpoints

### 2.1 Authentication & Profile
- **\`POST /auth/register\`**: Creates a new user account.
- **\`POST /auth/login\`**: Authenticates credentials and issues session token.
- **\`GET /profile\`**: Retrieves authenticated profile metadata.

${modules.map((m) => `### 2.2 Module Endpoints: ${m.name}
- **\`GET /api/${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`**
  - **Method:** \`GET\`
  - **Description:** Retrieve all records for ${m.name}.
  - **Response \`200 OK\`:** \`{ "success": true, "data": [...] }\`

- **\`POST /api/${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`**
  - **Method:** \`POST\`
  - **Description:** Create new entry in ${m.name}.
  - **Payload:** \`{ "name": "string", "details": {} }\`
  - **Response \`201 Created\`:** \`{ "success": true, "id": "uuid" }\`
`).join('\n')}
`;
      break;

    case 'Test Plan':
    case 'Test Cases':
      bodyContent = `
## 1. Quality Assurance Strategy & Scope
The test plan for **${projectName}** validates end-to-end reliability across Unit, Integration, Security, and E2E Web automation suites.

---

## 2. Test Cases Matrix

| Test ID | Module | Test Scenario | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | Auth | User Registration | 1. Enter email/pwd<br>2. Submit | Account created with JWT | **PASS** |
| **TC-002** | Auth | SQL Injection Resistance | 1. Inject payload into login | 400 Bad Request returned | **PASS** |
${modules.map((m, i) => `| **TC-${100 + i + 1}** | ${m.name} | Validate ${m.features[0] || 'Core workflow'} | 1. Navigate to ${m.name}<br>2. Execute action | Action executes < 300ms | **PASS** |`).join('\n')}
| **TC-201** | Performance | High RPS Concurrency | 1. Send 50 concurrent requests | Zero packet loss | **PASS** |
| **TC-202** | Export | PDF Document Generation | 1. Trigger export action | Valid A4 PDF downloaded | **PASS** |
`;
      break;

    case 'User Manual':
    case 'Installation Guide':
      bodyContent = `
## 1. Setup Prerequisites
Ensure you have the following installed on your host system:
- **Node.js:** v18.17.0+ or LTS
- **Database:** ${techStack.database[0] || 'PostgreSQL 15+'}
- **Package Manager:** npm v9+ or yarn

---

## 2. Step-by-Step Installation
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/organization/${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git

# 2. Navigate to project root
cd ${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}

# 3. Install dependencies
npm install

# 4. Configure environment variables
cp .env.example .env.local

# 5. Run database migrations
npx prisma db push

# 6. Start development server
npm run dev
\`\`\`

---

## 3. End-User Guide & Operation
1. Open \`http://localhost:3000\` in your browser.
2. Sign in with your registered credentials.
3. Access the dashboard to navigate through:
${modules.map((m) => `   - **${m.name}:** ${m.description}`).join('\n')}
`;
      break;

    default:
      bodyContent = `
## 1. Executive Summary & Context
This document serves as the comprehensive **${docType}** for **${projectName}** operating in the **${projectDomain}** domain.

- **Description:** ${projectDescription}
- **Primary Objective:** ${objectives || 'Deliver scalable, production-ready software solutions.'}

---

## 2. Key Findings & Implementation Breakdown
${modules.map((m, idx) => `### 2.${idx + 1} ${m.name} Scope
- **Assigned Role:** ${m.userRole}
- **Specifications:** ${m.description}
- **Key Modules & Features:** ${m.features.join(', ') || 'N/A'}
`).join('\n')}

---

## 3. Conclusion & Next Milestones
The architecture, requirements, and workflows outlined in this ${docType} ensure adherence to enterprise quality standards.
`;
      break;
  }

  return `[TEMPLATE_BADGE] ${docType}
# **${projectName} — ${docType}**

> **Document Type:** ${docType}  
> **Project Name:** ${projectName}  
> **Domain:** ${projectDomain}  
> **Generated Date:** ${currentDate}  
> **Compliance & Review:** Complete & Verified  

---

[PAGE BREAK]

${bodyContent}
`;
}
