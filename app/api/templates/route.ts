import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Standard seed templates if DB is freshly created
const defaultTemplates = [
  {
    id: 'tmpl-1',
    name: 'Executive Project Proposal',
    category: 'Business',
    description: 'Comprehensive corporate proposal structure with goals, timeline, and budget breakdowns.',
    previewImage: 'https://images.unsplash.com/photo-1542744094-3a31727223ec?w=400&q=80',
    usageCount: 142,
  },
  {
    id: 'tmpl-2',
    name: 'Technical Architecture Spec',
    category: 'Engineering',
    description: 'Detailed software specification covering system components, APIs, and data models.',
    previewImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
    usageCount: 98,
  },
  {
    id: 'tmpl-3',
    name: 'Marketing Strategy Brief',
    category: 'Marketing',
    description: 'Strategic plan detailing target persona, channel strategies, budget, and KPIs.',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    usageCount: 210,
  },
  {
    id: 'tmpl-4',
    name: 'Weekly Status Report',
    category: 'Management',
    description: 'Concise executive summary of completed milestones, risks, and next step objectives.',
    previewImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
    usageCount: 320,
  },
];

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { usageCount: 'desc' },
    });

    if (templates.length === 0) {
      return NextResponse.json({ templates: defaultTemplates });
    }

    return NextResponse.json({ templates });
  } catch (err: any) {
    // Return fallback templates if DB table hasn't been migrated yet
    return NextResponse.json({ templates: defaultTemplates });
  }
}
