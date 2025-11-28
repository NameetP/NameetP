import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const batch = await db.query.leadBatches.findFirst({
      where: (batches, { eq }) => eq(batches.id, params.batchId),
      with: {
        leads: {
          orderBy: (leads, { desc }) => [desc(leads.fitScore)],
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: batch.id,
      productDescription: batch.productDescription,
      outreachType: batch.outreachType,
      totalLeads: batch.totalLeads,
      leads: batch.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        website: lead.website,
        fitScore: lead.fitScore,
        fitRationale: lead.fitRationale,
        painPoints: lead.painPoints || [],
        outreachEmail: lead.outreachEmail,
        linkedinDm: lead.linkedinDm,
        callScript: lead.callScript,
        predictedObjections: lead.predictedObjections || [],
        recommendedNextStep: lead.recommendedNextStep,
        urgencyFraming: lead.urgencyFraming,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', message: error.message },
      { status: 500 }
    );
  }
}
