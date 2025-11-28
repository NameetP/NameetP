import { NextRequest, NextResponse } from 'next/server';
import { parseLeadCSV, validateLeads } from '@/lib/csv-parser';
import { db, leadBatches, leads, eq } from '@/lib/db';
import { processLead } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const productDescription = formData.get('productDescription') as string;
    const outreachType = formData.get('outreachType') as string;

    if (!file || !productDescription || !outreachType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse CSV
    const parseResult = await parseLeadCSV(file);

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', details: parseResult.errors },
        { status: 400 }
      );
    }

    // Validate leads
    const { valid, invalid } = validateLeads(parseResult.leads);

    if (valid.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found', details: invalid },
        { status: 400 }
      );
    }

    // TODO: Check user limits (for now, mock user)
    const userId = 'demo-user-id';

    // Create batch
    const [batch] = await db
      .insert(leadBatches)
      .values({
        userId,
        productDescription,
        outreachType,
        status: 'pending',
        totalLeads: valid.length,
        processedLeads: 0,
      })
      .returning();

    // Insert leads
    const leadsToInsert = valid.map((lead) => ({
      batchId: batch.id,
      userId,
      name: lead.name,
      company: lead.company,
      website: lead.website,
      linkedinUrl: lead.linkedinUrl,
      email: lead.email,
      status: 'pending' as const,
      processingLog: [],
    }));

    await db.insert(leads).values(leadsToInsert);

    // Start processing in background
    processLeadsInBackground(batch.id, productDescription, outreachType);

    return NextResponse.json({
      batchId: batch.id,
      totalLeads: valid.length,
      invalidLeads: invalid.length,
    });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch', message: error.message },
      { status: 500 }
    );
  }
}

async function processLeadsInBackground(
  batchId: string,
  productDescription: string,
  outreachType: string
) {
  // This runs in the background (not blocking the response)

  try {
    // Update batch status
    await db
      .update(leadBatches)
      .set({ status: 'processing' })
      .where(eq(leadBatches.id, batchId));

    // Get all leads for this batch
    const batchLeads = await db.query.leads.findMany({
      where: (l, { eq: eqFn }) => eqFn(l.batchId, batchId),
    });

    // Process each lead
    for (const lead of batchLeads) {
      try {
        // Update lead status
        await db
          .update(leads)
          .set({
            status: 'researching',
            processingLog: [
              {
                step: 'research',
                status: 'in_progress',
                timestamp: new Date().toISOString(),
              },
            ],
          })
          .where(eq(leads.id, lead.id));

        // Process lead
        const result = await processLead({
          productDescription,
          outreachType: outreachType as any,
          leadData: {
            name: lead.name || undefined,
            company: lead.company || undefined,
            website: lead.website || undefined,
            linkedinUrl: lead.linkedinUrl || undefined,
            email: lead.email || undefined,
          },
          onProgress: async (step) => {
            // Update processing log in real-time
            const currentLead = await db.query.leads.findFirst({
              where: (l, { eq: eqFn }) => eqFn(l.id, lead.id),
            });

            const currentLog = (currentLead?.processingLog as any[]) || [];
            const newLog = [
              ...currentLog,
              {
                step: step.step,
                status: step.status,
                timestamp: step.timestamp,
                message: step.message,
              },
            ];

            await db
              .update(leads)
              .set({ processingLog: newLog })
              .where(eq(leads.id, lead.id));
          },
        });

        // Save results
        await db
          .update(leads)
          .set({
            status: 'completed',
            fitScore: result.fitScore,
            fitRationale: result.whyFit,
            painPoints: result.painPoints,
            outreachEmail: result.outreachEmail,
            linkedinDm: result.linkedinDm,
            callScript: result.callScript,
            predictedObjections: result.predictedObjections,
            recommendedNextStep: result.recommendedNextStep,
            urgencyFraming: result.urgencyFraming,
          })
          .where(eq(leads.id, lead.id));

        // Update batch progress
        const currentBatch = await db.query.leadBatches.findFirst({
          where: (b, { eq: eqFn }) => eqFn(b.id, batchId),
        });

        if (currentBatch) {
          await db
            .update(leadBatches)
            .set({ processedLeads: (currentBatch.processedLeads || 0) + 1 })
            .where(eq(leadBatches.id, batchId));
        }
      } catch (error: any) {
        console.error(`Failed to process lead ${lead.id}:`, error);

        // Mark lead as failed
        await db
          .update(leads)
          .set({
            status: 'failed',
            errorMessage: error.message,
          })
          .where(eq(leads.id, lead.id));
      }
    }

    // Mark batch as completed
    await db
      .update(leadBatches)
      .set({ status: 'completed' })
      .where(eq(leadBatches.id, batchId));
  } catch (error) {
    console.error('Background processing failed:', error);

    await db
      .update(leadBatches)
      .set({ status: 'failed' })
      .where(eq(leadBatches.id, batchId));
  }
}
