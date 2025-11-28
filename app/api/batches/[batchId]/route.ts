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
          orderBy: (leads, { asc }) => [asc(leads.createdAt)],
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: batch.id,
      status: batch.status,
      totalLeads: batch.totalLeads,
      processedLeads: batch.processedLeads,
      leads: batch.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        website: lead.website,
        status: lead.status,
        fitScore: lead.fitScore,
        processingLog: lead.processingLog,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch', message: error.message },
      { status: 500 }
    );
  }
}
