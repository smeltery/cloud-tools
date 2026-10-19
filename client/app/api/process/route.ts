import { NextRequest, NextResponse } from 'next/server';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient, getSQSQueueUrl, JobStatus } from '@/root-lib/aws-config';

export interface ProcessRequest {
  jobId: string;
  operation: 'convert' | 'compress';
  targetFormat?: string;
  quality?: number;
  options?: Record<string, unknown>;
}

// POST /api/process - Queue a file for processing
export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { jobId, operation, targetFormat, quality, options } = body;

    if (!jobId || !operation) {
      return NextResponse.json({ error: 'Job ID and operation are required' }, { status: 400 });
    }

    if (!['convert', 'compress'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be "convert" or "compress"' },
        { status: 400 }
      );
    }

    // Create message for SQS queue
    const message = {
      jobId,
      operation,
      targetFormat,
      quality: quality || (operation === 'compress' ? 80 : undefined),
      options: options || {},
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    // Get SQS queue URL
    const queueUrl = await getSQSQueueUrl();

    // Send message to SQS queue
    const sendCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        jobId: {
          StringValue: jobId,
          DataType: 'String',
        },
        operation: {
          StringValue: operation,
          DataType: 'String',
        },
        ...(targetFormat && {
          targetFormat: {
            StringValue: targetFormat,
            DataType: 'String',
          },
        }),
      },
    });

    const result = await sqsClient.send(sendCommand);

    // Simulate updating job status to processing
    // In a real application, this would be done by the worker processing the queue
    await updateJobStatus(jobId, JobStatus.PROCESSING);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        messageId: result.MessageId,
        queueUrl,
        message: 'Job queued for processing',
      },
    });
  } catch (error) {
    console.error('Process job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to queue job for processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to update job status
async function updateJobStatus(jobId: string, status: JobStatus, progress?: number) {
  try {
    // Call the jobs API to update status
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          status,
          progress,
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to update job status:', await response.text());
    }
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

// GET /api/process - Get processing queue status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'queue-status') {
      // Get queue attributes (approximate message count, etc.)
      const queueUrl = await getSQSQueueUrl();

      // In a real implementation, you would get queue attributes
      // For demo purposes, we'll return mock data
      return NextResponse.json({
        success: true,
        data: {
          queueUrl,
          approximateNumberOfMessages: 0,
          approximateNumberOfMessagesNotVisible: 0,
          status: 'available',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=queue-status' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Get queue status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get queue status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/process - Cancel a processing job (remove from queue)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Find the message in the SQS queue by jobId
    // 2. Delete the message from the queue
    // 3. Update the job status to cancelled

    // For demo purposes, we'll just update the job status
    await updateJobStatus(jobId, JobStatus.FAILED, 0);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        message: 'Job cancelled and removed from processing queue',
      },
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
