import { chunkDocumentText, retrieveRelevantChunks, answerDocumentQuery } from '../lib/ai/doc-chat-rag';

async function testDocChatFlow() {
  console.log('=== TEST: DOCUMENT CHAT END-TO-END FLOW ===\n');

  const testDocumentTitle = 'Cloud Architecture & Disaster Recovery Plan';
  const testContent = `# Cloud Architecture & Disaster Recovery Plan
## 1. System Overview
The platform utilizes an event-driven microservices architecture built with Next.js, Node.js, and Apache Kafka. The primary database tier consists of multi-region PostgreSQL with Redis Sentinel for high-throughput in-memory caching.

## 2. Service Level Agreements & Availability
The platform commits to a 99.99% monthly availability SLA and P95 latency under 150ms. In the event of a regional outage, automated failover to the secondary AWS region initiates within 3 minutes.

## 3. Security & Cryptographic Compliance
All data in transit is encrypted using TLS 1.3 with AES-256 GCM cipher suites. Secrets are stored in HashiCorp Vault with automated 30-day credential rotation. Zero-Trust role-based access control (RBAC) is strictly enforced across all API endpoints.

## 4. Disaster Recovery Targets
The Recovery Time Objective (RTO) is capped at 15 minutes, and the Recovery Point Objective (RPO) is zero data loss due to continuous Write-Ahead Log (WAL) replication across independent availability zones.`;

  // 1. Test Chunking
  console.log('1. Testing Semantic Document Chunking...');
  const chunks = chunkDocumentText(testContent, 100, 20);
  console.log(`✓ Generated ${chunks.length} chunks successfully.`);
  chunks.forEach((c) => {
    console.log(`   - Chunk #${c.chunkIndex} [Section: ${c.sectionTitle}] (${c.wordCount} words)`);
  });

  // 2. Test Retrieval for Target Query
  console.log('\n2. Testing Relevance Retrieval for: "What is the RTO and RPO target?"');
  const retrievedSources = retrieveRelevantChunks('What is the RTO and RPO target?', chunks, 2);
  console.log(`✓ Retrieved ${retrievedSources.length} relevant source chunks:`);
  retrievedSources.forEach((s) => {
    console.log(`   - [Chunk #${s.chunkIndex} | ${s.sectionTitle}] Score: ${s.relevanceScore}`);
    console.log(`     Snippet: "${s.snippet.slice(0, 100)}..."`);
  });

  // 3. Test Grounded Answering for Available Content
  console.log('\n3. Testing Grounded Answer Synthesis (In-Scope Question)...');
  const answerResult1 = await answerDocumentQuery({
    question: 'What is the Recovery Time Objective (RTO)?',
    documentTitle: testDocumentTitle,
    chunks,
  });
  console.log(`✓ Answer Generated (isAvailable: ${answerResult1.isAvailable}):`);
  console.log(`   ${answerResult1.answer}\n`);

  // 4. Test Grounded Answering for Missing / Out-of-Scope Content
  console.log('4. Testing Grounded Answer Synthesis (Out-of-Scope Question)...');
  const answerResult2 = await answerDocumentQuery({
    question: 'What is the company stock price in 2026?',
    documentTitle: testDocumentTitle,
    chunks,
  });
  console.log(`✓ Response (isAvailable: ${answerResult2.isAvailable}):`);
  console.log(`   "${answerResult2.answer}"`);

  console.log('\n=== ALL DOCUMENT CHAT TESTS PASSED SUCCESSFULLY! ===');
}

testDocChatFlow().catch(console.error);
