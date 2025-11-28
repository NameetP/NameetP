import { NextRequest, NextResponse } from 'next/server';
import { parseLeadCSV, validateLeads } from '@/lib/csv-parser';
import { db, leadBatches, leads } from '@/lib/db';
import { processLead } from '@/lib/agents/orchestrator';
import { getCurrentMonth } from '@/lib/utils';

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
      status: 'pending',
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
  // In production, this should be moved to a proper queue (BullMQ/Temporal)

  try {
    // Update batch status
    await db
      .update(leadBatches)
      .set({ status: 'processing' })
      .where(leadBatches.id.equals(batchId));

    // Get all leads for this batch
    const batchLeads = await db.query.leads.findMany({
      where: (leads, { eq }) => eq(leads.batchId, batchId),
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
          .where(leads.id.equals(lead.id));

        // Process lead
        const result = await processLead({
          productDescription,
          outreachType,
          leadData: {
            name: lead.name || undefined,
            company: lead.company || undefined,
            website: lead.website || undefined,
            linkedinUrl: lead.linkedinUrl || undefined,
            email: lead.email || undefined,
          },
          onProgress: async (step) => {
            // Update processing log in real-time
            const currentLog = (await db.query.leads.findFirst({
              where: (leads, { eq }) => eq(leads.id, lead.id),
            }))?.processingLog || [];

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
              .where(leads.id.equals(lead.id));
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
          .where(leads.id.equals(lead.id));

        // Update batch progress
        const batch = await db.query.leadBatches.findFirst({
          where: (batches, { eq }) => eq(batches.id, batchId),
        });

        if (batch) {
          await db
            .update(leadBatches)
            .set({ processedLeads: (batch.processedLeads || 0) + 1 })
            .where(leadBatches.id.equals(batchId));
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
          .where(leads.id.equals(lead.id));
      }
    }

    // Mark batch as completed
    await db
      .update(leadBatches)
      .set({ status: 'completed' })
      .where(leadBatches.id.equals(batchId));
  } catch (error) {
    console.error('Background processing failed:', error);

    await db
      .update(leadBatches)
      .set({ status: 'failed' })
      .where(leadBatches.id.equals(batchId));
  }
}
