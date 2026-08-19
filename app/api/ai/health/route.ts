import { NextResponse } from 'next/server';
import { checkGroqHealth } from '@/lib/ai/groq';

export const dynamic = 'force-dynamic';

/**
 * Backend-Side Groq AI Engine & Model Health Check
 * GET /api/ai/health
 */
export async function GET() {
  try {
    const health = await checkGroqHealth();

    return NextResponse.json({
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      provider: health.provider,
      model: health.model,
      latencyMs: health.latencyMs,
      error: health.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        provider: 'groq',
        error: 'Failed to verify AI service status. Please contact the administrator.',
      },
      { status: 500 }
    );
  }
}
