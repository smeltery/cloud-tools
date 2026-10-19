/**
 * @fileoverview AWS configuration and client setup for Cloud Tools.
 *
 * This module provides centralized AWS service configuration and client instantiation
 * for the Cloud Tools application. It handles both production AWS environments and
 * development LocalStack environments, automatically configuring clients based on
 * the NODE_ENV environment variable.
 *
 * Key Features:
 * - Automatic LocalStack vs AWS configuration detection
 * - Pre-configured S3, DynamoDB, and SQS clients
 * - Resource naming constants and job management enums
 * - Utility functions for file type detection and S3 key generation
 * - Development-friendly LocalStack integration
 *
 * @author Cloud Tools Team
 * @since 1.0.0
 */

import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Determines if the application is running in development mode with LocalStack.
 *
 * @private
 * @type {boolean}
 */
const isLocal =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

/**
 * AWS endpoint URL for LocalStack development or undefined for production AWS.
 *
 * @private
 * @type {string | undefined}
 */
const endpoint = isLocal ? process.env.AWS_ENDPOINT_URL : undefined;

/**
 * Common AWS client configuration object.
 *
 * Provides shared configuration for all AWS service clients, handling both
 * LocalStack development and production AWS environments automatically.
 *
 * @private
 * @type {object}
 */
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  endpoint,
  credentials: isLocal
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
      }
    : undefined,
};

/**
 * Pre-configured S3 client for file storage operations.
 *
 * This client is automatically configured for both LocalStack development
 * and production AWS environments. For LocalStack, it includes path-style
 * addressing and disables acceleration endpoints to ensure compatibility.
 *
 * @type {S3Client}
 *
 * @example
 * // Upload a file to S3
 * import { s3Client } from './aws-config';
 * import { PutObjectCommand } from '@aws-sdk/client-s3';
 *
 * const command = new PutObjectCommand({
 *   Bucket: 'my-bucket',
 *   Key: 'uploads/file.jpg',
 *   Body: fileBuffer,
 *   ContentType: 'image/jpeg'
 * });
 * await s3Client.send(command);
 *
 * @since 1.0.0
 */
export const s3Client = new S3Client({
  ...awsConfig,
  forcePathStyle: isLocal, // Required for LocalStack S3
  ...(isLocal && {
    // Additional LocalStack-specific S3 configuration
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
  }),
});

/**
 * Pre-configured DynamoDB client for database operations.
 *
 * Low-level DynamoDB client for advanced operations. For most use cases,
 * prefer the {@link docClient} for easier document-based operations.
 *
 * @type {DynamoDBClient}
 *
 * @example
 * import { dynamoClient } from './aws-config';
 * import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
 *
 * const command = new CreateTableCommand({
 *   TableName: 'MyTable',
 *   // ... table configuration
 * });
 * await dynamoClient.send(command);
 *
 * @since 1.0.0
 */
export const dynamoClient = new DynamoDBClient(awsConfig);

/**
 * Pre-configured DynamoDB Document client for easier document operations.
 *
 * High-level DynamoDB client that handles marshaling and unmarshalling
 * of JavaScript objects to/from DynamoDB attribute values automatically.
 * Recommended for most document-based database operations.
 *
 * @type {DynamoDBDocumentClient}
 *
 * @example
 * import { docClient } from './aws-config';
 * import { PutCommand } from '@aws-sdk/lib-dynamodb';
 *
 * const command = new PutCommand({
 *   TableName: 'Jobs',
 *   Item: {
 *     jobId: '123',
 *     status: 'pending',
 *     createdAt: new Date().toISOString()
 *   }
 * });
 * await docClient.send(command);
 *
 * @since 1.0.0
 */
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Pre-configured SQS client for queue operations.
 *
 * This client is automatically configured for both LocalStack development
 * and production AWS environments. For LocalStack, it ensures proper
 * endpoint handling to avoid DNS resolution issues.
 *
 * @type {SQSClient}
 *
 * @example
 * import { sqsClient } from './aws-config';
 * import { SendMessageCommand } from '@aws-sdk/client-sqs';
 *
 * const command = new SendMessageCommand({
 *   QueueUrl: 'https://sqs.region.amazonaws.com/account/queue',
 *   MessageBody: JSON.stringify({ jobId: '123', operation: 'convert' })
 * });
 * await sqsClient.send(command);
 *
 * @since 1.0.0
 */
export const sqsClient = new SQSClient({
  ...awsConfig,
  ...(isLocal && {
    // Force SQS to use the configured endpoint
    useQueueUrlAsEndpoint: false,
  }),
});

/**
 * AWS resource names and configuration constants.
 *
 * Centralized configuration object containing resource identifiers
 * used throughout the application. Values are sourced from environment
 * variables with sensible defaults for LocalStack development.
 *
 * @type {object}
 * @readonly
 *
 * @property {string} S3_BUCKET - S3 bucket name for file storage
 * @property {string} DYNAMODB_TABLE - DynamoDB table name for job tracking
 * @property {string} SQS_QUEUE - SQS queue name for job processing
 * @property {string|undefined} SQS_QUEUE_URL - Pre-constructed SQS queue URL (LocalStack only)
 *
 * @example
 * import { AWS_RESOURCES } from './aws-config';
 *
 * console.log(AWS_RESOURCES.S3_BUCKET); // 'cloud-tools-local-bucket'
 * console.log(AWS_RESOURCES.DYNAMODB_TABLE); // 'CloudToolsJobs'
 *
 * @since 1.0.0
 */
export const AWS_RESOURCES = {
  S3_BUCKET: process.env.S3_BUCKET_NAME || "cloud-tools-local-bucket",
  DYNAMODB_TABLE: process.env.DDB_TABLE_NAME || "CloudToolsJobs",
  SQS_QUEUE: process.env.SQS_QUEUE_NAME || "cloud-tools-jobs-queue",
  SQS_QUEUE_URL: isLocal
    ? `http://localhost:4566/000000000000/${process.env.SQS_QUEUE_NAME || "cloud-tools-jobs-queue"}`
    : undefined, // Will be retrieved dynamically in production
} as const;

/**
 * Enumeration of possible job processing states.
 *
 * Represents the lifecycle stages of a file processing job from
 * initial creation through completion or failure.
 *
 * @enum {string}
 *
 * @example
 * import { JobStatus } from './aws-config';
 *
 * const job = {
 *   id: '123',
 *   status: JobStatus.PENDING,
 *   // ... other properties
 * };
 *
 * // Update status as job progresses
 * job.status = JobStatus.PROCESSING;
 * job.status = JobStatus.COMPLETED;
 *
 * @since 1.0.0
 */
export enum JobStatus {
  /** Job has been created but not yet started processing */
  PENDING = "pending",
  /** Job is currently being processed by a worker */
  PROCESSING = "processing",
  /** Job has been successfully completed */
  COMPLETED = "completed",
  /** Job processing has failed */
  FAILED = "failed",
}

/**
 * Enumeration of supported file processing job types.
 *
 * Categorizes different types of file processing operations supported
 * by the Cloud Tools application. Each type corresponds to specific
 * file formats and processing capabilities.
 *
 * @enum {string}
 *
 * @example
 * import { JobType } from './aws-config';
 *
 * const job = {
 *   id: '123',
 *   type: JobType.IMAGE_CONVERSION,
 *   inputFormat: 'jpg',
 *   outputFormat: 'webp'
 * };
 *
 * @since 1.0.0
 */
export enum JobType {
  /** Convert image files between different formats (JPEG, PNG, WebP, etc.) */
  IMAGE_CONVERSION = "image_conversion",
  /** Compress image files to reduce file size while maintaining quality */
  IMAGE_COMPRESSION = "image_compression",
  /** Convert video files between different formats and codecs */
  VIDEO_CONVERSION = "video_conversion",
  /** Convert audio files between different formats and codecs */
  AUDIO_CONVERSION = "audio_conversion",
  /** Compress PDF files to reduce file size */
  PDF_COMPRESSION = "pdf_compression",
  /** Convert eBook files between different formats (EPUB, MOBI, etc.) */
  EBOOK_CONVERSION = "ebook_conversion",
}

/**
 * Retrieves the SQS queue URL for the specified queue.
 *
 * In LocalStack development environments, returns a manually constructed URL
 * to avoid DNS resolution issues. In production, dynamically fetches the queue URL
 * from AWS SQS service.
 *
 * @param {string} [queueName=AWS_RESOURCES.SQS_QUEUE] - Name of the SQS queue.
 *   Defaults to the configured queue name from AWS_RESOURCES.
 *
 * @returns {Promise<string>} Promise that resolves to the complete SQS queue URL.
 *
 * @throws {Error} When the queue URL cannot be found in production environments.
 *
 * @example
 * // Get default queue URL
 * const queueUrl = await getSQSQueueUrl();
 * // Returns: 'http://localhost:4566/000000000000/cloud-tools-jobs-queue' (LocalStack)
 * // Returns: 'https://sqs.us-east-1.amazonaws.com/123456789012/cloud-tools-jobs-queue' (AWS)
 *
 * @example
 * // Get specific queue URL
 * const customQueueUrl = await getSQSQueueUrl('my-custom-queue');
 *
 * @since 1.0.0
 */
export async function getSQSQueueUrl(
  queueName: string = AWS_RESOURCES.SQS_QUEUE,
): Promise<string> {
  if (isLocal) {
    // For LocalStack, always use our manually constructed URL to avoid DNS issues
    return `http://localhost:4566/000000000000/${queueName}`;
  }

  // In production, get the queue URL dynamically
  const { GetQueueUrlCommand } = await import("@aws-sdk/client-sqs");
  const command = new GetQueueUrlCommand({ QueueName: queueName });
  const response = await sqsClient.send(command);

  if (!response.QueueUrl) {
    throw new Error(`Queue URL not found for queue: ${queueName}`);
  }

  return response.QueueUrl;
}

/**
 * Retrieves the configured S3 bucket name for file storage.
 *
 * Returns the S3 bucket name from the AWS_RESOURCES configuration.
 * This function provides a consistent interface for accessing the bucket name
 * and can be extended for more complex bucket selection logic in the future.
 *
 * @returns {Promise<string>} Promise that resolves to the S3 bucket name.
 *
 * @example
 * const bucketName = await getS3BucketName();
 * console.log(bucketName); // 'cloud-tools-local-bucket'
 *
 * @since 1.0.0
 */
export async function getS3BucketName(): Promise<string> {
  return AWS_RESOURCES.S3_BUCKET;
}

/**
 * Generates a structured S3 object key for file storage.
 *
 * Creates a hierarchical S3 key structure that includes the folder, date,
 * job ID, and sanitized filename. This provides organization and prevents
 * naming conflicts while maintaining readability.
 *
 * The generated key structure is: `{folder}/{YYYY-MM-DD}/{jobId}/{sanitizedFileName}`
 *
 * @param {string} jobId - Unique identifier for the processing job.
 * @param {string} fileName - Original filename of the uploaded file.
 * @param {string} [folder='uploads'] - S3 folder prefix for organization.
 *   Common values include 'uploads' and 'processed'.
 *
 * @returns {string} Structured S3 object key ready for storage operations.
 *
 * @example
 * const key = generateS3Key('job-123', 'my file.jpg');
 * // Returns: 'uploads/2023-12-01/job-123/my_file.jpg'
 *
 * @example
 * const processedKey = generateS3Key('job-123', 'output.webp', 'processed');
 * // Returns: 'processed/2023-12-01/job-123/output.webp'
 *
 * @since 1.0.0
 */
export function generateS3Key(
  jobId: string,
  fileName: string,
  folder: string = "uploads",
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${timestamp}/${jobId}/${sanitizedFileName}`;
}

/**
 * Extracts and normalizes the file extension from a filename.
 *
 * Safely extracts the file extension from a filename, handling edge cases
 * like filenames without extensions or multiple dots. The extension is
 * returned in lowercase for consistent comparisons.
 *
 * @param {string} fileName - Filename to extract extension from.
 *
 * @returns {string} Lowercase file extension without the dot, or empty string
 *   if no extension is found.
 *
 * @example
 * getFileExtension('document.pdf'); // Returns: 'pdf'
 * getFileExtension('image.JPEG'); // Returns: 'jpeg'
 * getFileExtension('archive.tar.gz'); // Returns: 'gz'
 * getFileExtension('README'); // Returns: ''
 *
 * @since 1.0.0
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length === 1 || (parts.length === 2 && parts[0] === "")) {
    // No extension (e.g., 'README') or hidden file (e.g., '.gitignore')
    return parts.length === 2 ? parts[1].toLowerCase() : "";
  }
  return parts.pop()?.toLowerCase() || "";
}

/**
 * Determines the appropriate job type based on file extension and operation.
 *
 * Analyzes the file extension and requested operation to determine the most
 * appropriate job type for processing. This function acts as a file type
 * classifier that maps extensions to processing categories.
 *
 * Supported file types:
 * - **Images**: jpg, jpeg, png, gif, webp, bmp, tiff, svg
 * - **Videos**: mp4, avi, mov, mkv, wmv, flv, webm
 * - **Audio**: mp3, wav, flac, aac, ogg, m4a, wma
 * - **PDFs**: pdf (compression only)
 * - **eBooks**: epub, mobi, azw, pdf, txt, doc, docx
 *
 * @param {string} fileName - Name of the file to be processed.
 * @param {'convert' | 'compress'} operation - Type of operation to perform.
 *
 * @returns {JobType} The most appropriate job type for the file and operation.
 *   Returns IMAGE_CONVERSION as a fallback for unknown file types.
 *
 * @example
 * // Image conversion
 * getJobTypeFromFile('photo.jpg', 'convert'); // Returns: JobType.IMAGE_CONVERSION
 *
 * // Image compression
 * getJobTypeFromFile('photo.png', 'compress'); // Returns: JobType.IMAGE_COMPRESSION
 *
 * // Video conversion
 * getJobTypeFromFile('movie.mp4', 'convert'); // Returns: JobType.VIDEO_CONVERSION
 *
 * // PDF compression
 * getJobTypeFromFile('document.pdf', 'compress'); // Returns: JobType.PDF_COMPRESSION
 *
 * // Unknown file type (fallback)
 * getJobTypeFromFile('unknown.xyz', 'convert'); // Returns: JobType.IMAGE_CONVERSION
 *
 * @since 1.0.0
 */
export function getJobTypeFromFile(
  fileName: string,
  operation: "convert" | "compress",
): JobType {
  const extension = getFileExtension(fileName);

  if (operation === "compress") {
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension)) {
      return JobType.IMAGE_COMPRESSION;
    }
    if (extension === "pdf") {
      return JobType.PDF_COMPRESSION;
    }
  }

  if (operation === "convert") {
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"].includes(
        extension,
      )
    ) {
      return JobType.IMAGE_CONVERSION;
    }
    if (
      ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm"].includes(extension)
    ) {
      return JobType.VIDEO_CONVERSION;
    }
    if (
      ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma"].includes(extension)
    ) {
      return JobType.AUDIO_CONVERSION;
    }
    if (
      ["epub", "mobi", "azw", "pdf", "txt", "doc", "docx"].includes(extension)
    ) {
      return JobType.EBOOK_CONVERSION;
    }
  }

  return JobType.IMAGE_CONVERSION; // Default fallback
}
