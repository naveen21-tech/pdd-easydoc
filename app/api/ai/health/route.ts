import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ai/ollama';

export const dynamic = 'force-dynamic';

/**
 * Backend-Side Ollama Server & Model Health Check
 * GET /api/ai/health
 */
export async function GET() {
  try {
    const health = await checkOllamaHealth();

    return NextResponse.json({
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      documentModel: health.documentModel,
      mcqModel: health.mcqModel,
      documentModelReady: health.documentModelAvailable,
      mcqModelReady: health.mcqModelAvailable,
      latencyMs: health.latencyMs,
      availableModels: health.availableModels,
      error: health.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to verify AI service status. Please contact the administrator.',
      },
      { status: 500 }
    );
  }
}
