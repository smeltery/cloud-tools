import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  s3Client,
  docClient,
  AWS_RESOURCES,
  generateS3Key,
  getJobTypeFromFile,
  JobStatus,
} from '@/root-lib/aws-config';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string; // 'convert' or 'compress'
    const targetFormat = formData.get('targetFormat') as string; // target format (optional)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!operation || !['convert', 'compress'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be "convert" or "compress"' },
        { status: 400 }
      );
    }

    // Generate job ID and S3 key
    const jobId = crypto.randomUUID();
    const s3Key = generateS3Key(jobId, file.name);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: AWS_RESOURCES.S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        jobId: jobId,
        operation: operation,
        targetFormat: targetFormat || '',
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);

    // Determine job type
    const jobType = getJobTypeFromFile(file.name, operation as 'convert' | 'compress');

    // Create job record in DynamoDB
    const now = new Date().toISOString();
    const jobRecord = {
      jobId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      s3Key,
      operation,
      targetFormat,
      jobType,
      status: JobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      progress: 0,
    };

    const putCommand = new PutCommand({
      TableName: AWS_RESOURCES.DYNAMODB_TABLE,
      Item: jobRecord,
    });

    await docClient.send(putCommand);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        jobId,
        s3Key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        operation,
        targetFormat,
        jobType,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
