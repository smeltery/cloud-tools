import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, AWS_RESOURCES, JobStatus, JobType } from '@/root-lib/aws-config';

export interface Job {
  jobId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  operation: 'convert' | 'compress';
  targetFormat?: string;
  jobType: JobType;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
  progress?: number;
  // Compression savings tracking
  originalFileSize?: number;
  processedFileSize?: number;
  compressionSavings?: number; // Percentage savings (0-100)
}

// GET /api/jobs - List all jobs or get specific job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job
      const command = new GetCommand({
        TableName: AWS_RESOURCES.DYNAMODB_TABLE,
        Key: { jobId },
      });

      const result = await docClient.send(command);

      if (!result.Item) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: result.Item as Job,
      });
    } else {
      // List all jobs (with optional filtering)
      const status = searchParams.get('status') as JobStatus;
      const limit = parseInt(searchParams.get('limit') || '50');

      const command = new ScanCommand({
        TableName: AWS_RESOURCES.DYNAMODB_TABLE,
        Limit: limit,
        ...(status && {
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': status },
        }),
      });

      const result = await docClient.send(command);

      return NextResponse.json({
        success: true,
        data: (result.Items as Job[]) || [],
        count: result.Items?.length || 0,
      });
    }
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, fileName, fileSize, fileType, s3Key, operation, targetFormat, jobType } = body;

    if (!jobId || !fileName || !s3Key || !operation || !jobType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const job: Job = {
      jobId,
      fileName,
      fileSize: fileSize || 0,
      fileType: fileType || '',
      s3Key,
      operation,
      targetFormat,
      jobType,
      status: JobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      progress: 0,
    };

    const command = new PutCommand({
      TableName: AWS_RESOURCES.DYNAMODB_TABLE,
      Item: job,
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/jobs - Update job status/progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      status,
      progress,
      downloadUrl,
      errorMessage,
      originalFileSize,
      processedFileSize,
      compressionSavings,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (status) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;

      // If status is completed, set completedAt
      if (status === JobStatus.COMPLETED) {
        updateExpression.push('completedAt = :completedAt');
        expressionAttributeValues[':completedAt'] = new Date().toISOString();
      }
    }

    if (progress !== undefined) {
      updateExpression.push('progress = :progress');
      expressionAttributeValues[':progress'] = progress;
    }

    if (downloadUrl) {
      updateExpression.push('downloadUrl = :downloadUrl');
      expressionAttributeValues[':downloadUrl'] = downloadUrl;
    }

    if (errorMessage) {
      updateExpression.push('errorMessage = :errorMessage');
      expressionAttributeValues[':errorMessage'] = errorMessage;
    }

    // Compression savings tracking
    if (originalFileSize !== undefined) {
      updateExpression.push('originalFileSize = :originalFileSize');
      expressionAttributeValues[':originalFileSize'] = originalFileSize;
    }

    if (processedFileSize !== undefined) {
      updateExpression.push('processedFileSize = :processedFileSize');
      expressionAttributeValues[':processedFileSize'] = processedFileSize;
    }

    if (compressionSavings !== undefined) {
      updateExpression.push('compressionSavings = :compressionSavings');
      expressionAttributeValues[':compressionSavings'] = compressionSavings;
    }

    const command = new UpdateCommand({
      TableName: AWS_RESOURCES.DYNAMODB_TABLE,
      Key: { jobId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
        ? expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);

    return NextResponse.json({
      success: true,
      data: result.Attributes as Job,
    });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
