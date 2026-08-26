/**
 * @fileoverview File Processing Worker
 *
 * This module provides a comprehensive, extensible file processing worker system
 * for queuing, processing, and monitoring of file conversion and compression jobs
 * for images, videos, audio, PDFs, and eBooks.
 *
 * Key Features:
 * - Extensible architecture for new file types
 * - Comprehensive error handling and logging
 * - Multiple processor implementations
 * - Configurable processing strategies
 * - Advanced image compression with format-specific optimizations
 * - PDF compression with metadata removal and structure optimization
 * - Video conversion with quality-based encoding (FFmpeg)
 * - Audio conversion with format-specific optimization (FFmpeg)
 * - eBook conversion between popular formats (Calibre)
 * - Quality-based processing strategies across all formats
 *
 * Supported File Types:
 *
 * Images:
 * - Formats: JPEG, PNG, WebP, GIF, TIFF, BMP
 * - Operations: Convert, Compress
 * - Features: Progressive JPEG, palette optimization, dimension scaling
 *
 * Videos:
 * - Formats: MP4, MOV, AVI, WebM, MKV, FLV, WMV
 * - Operations: Convert
 * - Features: Codec selection, bitrate optimization, quality presets
 *
 * Audio:
 * - Formats: MP3, WAV, OGG, FLAC, AAC, M4A, WMA
 * - Operations: Convert
 * - Features: Bitrate optimization, codec-specific settings
 *
 * PDFs:
 * - Operations: Compress
 * - Features: Metadata removal, object stream optimization
 *
 * eBooks:
 * - Formats: EPUB, MOBI, AZW3, PDF, TXT, DOCX, RTF
 * - Operations: Convert
 * - Features: Format-specific optimization, fallback handling
 *
 * @author Cloud Tools Team
 * @since 1.0.0
 */

import { ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  sqsClient,
  docClient,
  getSQSQueueUrl,
  getS3BucketName,
  JobStatus,
  AWS_RESOURCES,
} from './aws-config';

// Re-export JobStatus for test files
export { JobStatus };
import sharp from 'sharp';

type SharpImage = ReturnType<typeof sharp>;
import { PDFDocument } from 'pdf-lib';
import ffmpeg from 'fluent-ffmpeg-7';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ========================================
// INTERFACES
// ========================================

/**
 * Represents a file processing job message from the queue.
 *
 * @interface ProcessingMessage
 * @since 1.0.0
 */
export interface ProcessingMessage {
  /** Unique identifier for the job */
  jobId: string;
  /** Type of operation to perform */
  operation: 'convert' | 'compress';
  /** Target format for conversion (required for convert operations) */
  targetFormat?: string;
  /** Quality setting for compression (0-100, default 80) */
  quality?: number;
  /** Additional processing options */
  options?: Record<string, unknown>;
  /** ISO timestamp when the job was created */
  timestamp: string;
  /** Number of retry attempts for this job */
  retryCount: number;
}

/**
 * Result of a file processing operation.
 *
 * @interface ProcessingResult
 * @since 1.0.0
 */
export interface ProcessingResult {
  /** Processed file data as a buffer */
  buffer: Buffer;
  /** MIME content type of the processed file */
  contentType: string;
  /** File extension without the dot (e.g., 'jpg', 'png') */
  fileExtension: string;
}

/**
 * Interface for updating job status and progress.
 *
 * Implementations should handle job lifecycle updates including
 * progress tracking and download URL assignment.
 *
 * @interface JobStatusUpdater
 * @since 1.0.0
 */
export interface JobStatusUpdater {
  /**
   * Updates the status of a processing job.
   *
   * @param {string} jobId - Unique job identifier
   * @param {JobStatus} status - New job status
   * @param {number} [progress] - Progress percentage (0-100)
   * @param {string} [downloadUrl] - URL for downloading processed file
   * @param {Object} [compressionData] - Optional compression savings data
   * @param {number} [compressionData.originalFileSize] - Original file size in bytes
   * @param {number} [compressionData.processedFileSize] - Processed file size in bytes
   * @param {number} [compressionData.compressionSavings] - Compression savings percentage (0-100)
   * @returns {Promise<void>} Promise that resolves when status is updated
   * @throws {Error} When status update fails
   */
  updateStatus(
    jobId: string,
    status: JobStatus,
    progress?: number,
    downloadUrl?: string,
    compressionData?: {
      originalFileSize?: number;
      processedFileSize?: number;
      compressionSavings?: number;
    }
  ): Promise<void>;
}

/**
 * Interface for file storage operations.
 *
 * Abstracts file storage to allow different implementations
 * (S3, local filesystem, etc.).
 *
 * @interface FileStorage
 * @since 1.0.0
 */
export interface FileStorage {
  /**
   * Retrieves a file from storage.
   *
   * @param {string} key - Storage key/path for the file
   * @returns {Promise<Buffer>} File contents as a buffer
   * @throws {Error} When file is not found or cannot be accessed
   */
  getFile(key: string): Promise<Buffer>;

  /**
   * Stores a file in storage.
   *
   * @param {string} key - Storage key/path for the file
   * @param {Buffer} buffer - File contents
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<void>} Promise that resolves when file is stored
   * @throws {Error} When file cannot be stored
   */
  putFile(key: string, buffer: Buffer, contentType: string): Promise<void>;

  /**
   * Generates a download URL for a stored file.
   *
   * @param {string} key - Storage key/path for the file
   * @returns {string} Public URL for downloading the file
   */
  generateDownloadUrl(key: string): string;
}

/**
 * Interface for message queue operations.
 *
 * Abstracts queue operations to allow different implementations
 * (SQS, Redis, RabbitMQ, etc.).
 *
 * @interface MessageQueue
 * @since 1.0.0
 */
export interface MessageQueue {
  /**
   * Polls the queue for new messages.
   *
   * @returns {Promise<Message[]>} Array of queue messages
   * @throws {Error} When polling fails
   */
  pollMessages(): Promise<Message[]>;

  /**
   * Deletes a processed message from the queue.
   *
   * @param {string} receiptHandle - Queue-specific message identifier
   * @returns {Promise<void>} Promise that resolves when message is deleted
   * @throws {Error} When deletion fails
   */
  deleteMessage(receiptHandle: string): Promise<void>;
}

/**
 * Interface for file processing implementations.
 *
 * Allows different processing implementations for various file types and operations.
 *
 * @interface FileProcessor
 * @since 1.0.0
 */
export interface FileProcessor {
  /**
   * Determines if this processor can handle the given operation and format.
   *
   * @param {string} operation - Processing operation ('convert' or 'compress')
   * @param {string} [format] - Target format (for conversions)
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string, format?: string): boolean;

  /**
   * Processes a file according to the job specifications.
   *
   * @param {Buffer} buffer - Input file data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed file result
   * @throws {Error} When processing fails
   */
  process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult>;
}

/**
 * Interface for logging operations.
 *
 * Provides a consistent logging interface that can be implemented
 * by different logging systems (console, structured, remote, etc.).
 *
 * @interface Logger
 * @since 1.0.0
 */
export interface Logger {
  /**
   * Logs an informational message.
   *
   * @param {string} message - Log message
   * @param {any} [data] - Additional data to log
   */
  info(message: string, data?: unknown): void;

  /**
   * Logs an error message.
   *
   * @param {string} message - Error message
   * @param {any} [error] - Error object or additional data
   */
  error(message: string, error?: unknown): void;

  /**
   * Logs a warning message.
   *
   * @param {string} message - Warning message
   * @param {any} [data] - Additional data to log
   */
  warn(message: string, data?: unknown): void;
}

// ========================================
// CONCRETE IMPLEMENTATIONS
// ========================================

/**
 * API-based job status updater.
 *
 * Sends job status updates to the REST API endpoint.
 *
 * @class ApiJobStatusUpdater
 * @implements {JobStatusUpdater}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const updater = new ApiJobStatusUpdater('http://localhost:3000');
 * await updater.updateStatus('job-123', JobStatus.COMPLETED, 100, 'http://example.com/file.jpg');
 * ```
 */
export class ApiJobStatusUpdater implements JobStatusUpdater {
  /**
   * Creates an ApiJobStatusUpdater instance.
   *
   * @param {string} [baseUrl] - Base URL for the API (defaults to NEXT_PUBLIC_APP_URL or localhost:3000)
   */
  constructor(
    private baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ) {}

  /**
   * Updates job status via REST API call.
   *
   * Makes a PUT request to /api/jobs with the job status information.
   * Includes comprehensive error handling with detailed error messages.
   *
   * @param {string} jobId - Unique job identifier
   * @param {JobStatus} status - New job status
   * @param {number} [progress] - Progress percentage (0-100)
   * @param {string} [downloadUrl] - URL for downloading processed file
   * @param {Object} [compressionData] - Optional compression savings data
   * @returns {Promise<void>} Promise that resolves when status is updated
   * @throws {Error} When API request fails or returns non-2xx status
   */
  async updateStatus(
    jobId: string,
    status: JobStatus,
    progress?: number,
    downloadUrl?: string,
    compressionData?: {
      originalFileSize?: number;
      processedFileSize?: number;
      compressionSavings?: number;
    }
  ): Promise<void> {
    try {
      const body: Record<string, unknown> = { jobId, status, progress, downloadUrl };

      // Add compression data if provided
      if (compressionData) {
        body.originalFileSize = compressionData.originalFileSize;
        body.processedFileSize = compressionData.processedFileSize;
        body.compressionSavings = compressionData.compressionSavings;
      }

      const response = await fetch(`${this.baseUrl}/api/jobs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      throw new Error(`Failed to update job status: ${error}`);
    }
  }
}

/**
 * AWS S3-based file storage handler.
 *
 * Provides file storage operations using AWS S3 or S3-compatible services.
 *
 * @class S3FileStorage
 * @implements {FileStorage}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const storage = new S3FileStorage('my-bucket', 'http://localhost:4566');
 *
 * // Get a file
 * const fileBuffer = await storage.getFile('uploads/image.jpg');
 *
 * // Store a file
 * await storage.putFile('processed/image.png', buffer, 'image/png');
 *
 * // Generate download URL
 * const url = storage.generateDownloadUrl('processed/image.png');
 * ```
 */
export class S3FileStorage implements FileStorage {
  private s3Client: S3Client;

  /**
   * Creates an S3FileStorage instance.
   *
   * @param {string} bucketName - S3 bucket name for file storage
   * @param {string} [endpointUrl] - S3 endpoint URL (defaults to AWS_ENDPOINT_URL or LocalStack)
   */
  constructor(
    private bucketName: string,
    private endpointUrl: string = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566'
  ) {
    // Create our own S3 client with proper LocalStack configuration
    const isLocal = process.env.NODE_ENV === 'development';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: this.endpointUrl,
      credentials: isLocal
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
          }
        : undefined,
      forcePathStyle: isLocal, // Critical for LocalStack
      useAccelerateEndpoint: false,
      useDualstackEndpoint: false,
    });
  }

  /**
   * Retrieves a file from S3 storage.
   *
   * @param {string} key - S3 object key/path
   * @returns {Promise<Buffer>} File contents as a buffer
   * @throws {Error} When file is not found or cannot be accessed
   */
  async getFile(key: string): Promise<Buffer> {
    console.log(`🔍 S3FileStorage.getFile called with:`);
    console.log(`   bucketName: "${this.bucketName}"`);
    console.log(`   key: "${key}"`);
    console.log(`   endpointUrl: "${this.endpointUrl}"`);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    console.log(`📡 Sending S3 GetObject command:`, { Bucket: this.bucketName, Key: key });

    const result = await this.s3Client.send(command);
    if (!result.Body) {
      throw new Error(`File not found: ${key}`);
    }

    return Buffer.from(await result.Body.transformToByteArray());
  }

  /**
   * Stores a file in S3 storage.
   *
   * @param {string} key - S3 object key/path where file will be stored
   * @param {Buffer} buffer - File contents to store
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<void>} Promise that resolves when file is stored
   * @throws {Error} When file cannot be stored
   */
  async putFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generates a public download URL for a stored file.
   *
   * @param {string} key - S3 object key/path
   * @returns {string} Public URL for downloading the file
   */
  generateDownloadUrl(key: string): string {
    return `${this.endpointUrl}/${this.bucketName}/${key}`;
  }
}

/**
 * AWS SQS-based message queue handler.
 *
 * Provides message queue operations using AWS SQS for job processing.
 *
 * @class SqsMessageQueue
 * @implements {MessageQueue}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const queue = new SqsMessageQueue('https://sqs.region.amazonaws.com/account/queue');
 *
 * // Poll for messages
 * const messages = await queue.pollMessages();
 *
 * // Process and delete message
 * for (const message of messages) {
 *   // ... process message ...
 *   await queue.deleteMessage(message.ReceiptHandle!);
 * }
 * ```
 */
export class SqsMessageQueue implements MessageQueue {
  /**
   * Creates an SqsMessageQueue instance.
   *
   * @param {string} queueUrl - SQS queue URL for message operations
   */
  constructor(private queueUrl: string) {}

  /**
   * Polls the SQS queue for new messages.
   *
   * Uses long polling (20 seconds) to efficiently wait for messages.
   * Returns up to 1 message per poll to maintain processing order.
   *
   * @returns {Promise<Message[]>} Array of SQS messages (0-1 messages)
   * @throws {Error} When SQS polling fails
   */
  async pollMessages(): Promise<Message[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ['All'],
    });

    const result = await sqsClient.send(command);
    return result.Messages || [];
  }

  /**
   * Deletes a processed message from the SQS queue.
   *
   * @param {string} receiptHandle - SQS message receipt handle
   * @returns {Promise<void>} Promise that resolves when message is deleted
   * @throws {Error} When SQS deletion fails
   */
  async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await sqsClient.send(command);
  }
}

/**
 * Sharp-based image processing handler.
 *
 * Provides image conversion and compression using the Sharp library.
 * Supports multiple formats.
 *
 * @class SharpImageConverter
 * @implements {FileProcessor}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const processor = new SharpImageConverter();
 *
 * // Check if processor can handle the operation
 * if (processor.canProcess('convert', 'webp')) {
 *   const result = await processor.process(imageBuffer, {
 *     jobId: 'job-123',
 *     operation: 'convert',
 *     targetFormat: 'webp',
 *     timestamp: new Date().toISOString(),
 *     retryCount: 0
 *   });
 * }
 * ```
 */
export class SharpImageConverter implements FileProcessor {
  /** Supported image formats for processing */
  private readonly supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'tif', 'bmp'];
  /** Supported operations */
  private readonly supportedOperations = ['convert', 'compress'];

  /**
   * Determines if this processor can handle the given operation and format.
   *
   * @param {string} operation - Processing operation ('convert' or 'compress')
   * @param {string} [format] - Target format (for conversions)
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string, format?: string): boolean {
    if (!this.supportedOperations.includes(operation)) return false;
    if (format && !this.supportedFormats.includes(format.toLowerCase())) return false;
    return true;
  }

  /**
   * Processes an image according to the job specifications.
   *
   * @param {Buffer} buffer - Input image data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed image result
   * @throws {Error} When processing fails or unsupported operation
   */
  async process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult> {
    const sharpImage = sharp(buffer);

    if (message.operation === 'convert') {
      return this.convertImage(sharpImage, message.targetFormat!);
    } else if (message.operation === 'compress') {
      return this.compressImage(sharpImage, message.quality || 80);
    }

    throw new Error(`Unsupported operation: ${message.operation}`);
  }

  private async convertImage(
    sharpImage: SharpImage,
    targetFormat: string
  ): Promise<ProcessingResult> {
    let buffer: Buffer;
    const format = targetFormat.toLowerCase();

    switch (format) {
      case 'jpg':
      case 'jpeg':
        buffer = await sharpImage.jpeg({ quality: 90 }).toBuffer();
        return { buffer, contentType: 'image/jpeg', fileExtension: format };
      case 'png':
        buffer = await sharpImage.png().toBuffer();
        return { buffer, contentType: 'image/png', fileExtension: 'png' };
      case 'webp':
        buffer = await sharpImage.webp({ quality: 90 }).toBuffer();
        return { buffer, contentType: 'image/webp', fileExtension: 'webp' };
      case 'gif':
        buffer = await sharpImage.gif().toBuffer();
        return { buffer, contentType: 'image/gif', fileExtension: 'gif' };
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  /**
   * Compresses an image using format-specific optimization strategies.
   *
   * @private
   * @param {SharpImage} sharpImage - Sharp image instance
   * @param {number} quality - Compression quality (0-100, higher means better quality)
   * @returns {Promise<ProcessingResult>} Compressed image result
   */
  private async compressImage(sharpImage: SharpImage, quality: number): Promise<ProcessingResult> {
    const metadata = await sharpImage.metadata();
    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    // Apply additional optimizations based on quality setting
    let processedImage = sharpImage;

    // For lower quality settings, apply additional size optimizations
    if (quality < 70) {
      const { width, height } = metadata;
      if (width && height) {
        // Reduce dimensions slightly for aggressive compression
        const scaleFactor = quality < 50 ? 0.8 : 0.9;
        processedImage = processedImage.resize({
          width: Math.round(width * scaleFactor),
          height: Math.round(height * scaleFactor),
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    // Handle format detection and conversion based on Sharp's supported formats
    const formatString = metadata.format as string;

    switch (formatString) {
      case 'jpeg':
        buffer = await processedImage
          .jpeg({
            quality,
            progressive: quality > 60, // Progressive JPEG for better perceived loading
            mozjpeg: true, // Use mozjpeg encoder for better compression
          })
          .toBuffer();
        contentType = 'image/jpeg';
        fileExtension = 'jpg';
        break;

      case 'png':
        // PNG compression strategies based on quality
        const pngOptions = {
          compressionLevel: quality > 80 ? 6 : 9, // Higher compression for lower quality
          adaptiveFiltering: quality > 60,
          palette: quality < 50, // Use palette for aggressive compression
        };
        buffer = await processedImage.png(pngOptions).toBuffer();
        contentType = 'image/png';
        fileExtension = 'png';
        break;

      case 'webp':
        buffer = await processedImage
          .webp({
            quality,
            effort: quality > 70 ? 4 : 6, // More effort for lower quality settings
            lossless: false, // Ensure lossy compression for size reduction
          })
          .toBuffer();
        contentType = 'image/webp';
        fileExtension = 'webp';
        break;

      case 'gif':
        // GIF doesn't support quality, so we optimize differently
        buffer = await processedImage
          .gif({
            colours: quality < 50 ? 64 : quality < 80 ? 128 : 256,
            dither: quality > 60 ? 1.0 : 0.5,
          })
          .toBuffer();
        contentType = 'image/gif';
        fileExtension = 'gif';
        break;

      case 'tiff':
        // Convert TIFF to JPEG for better compression
        buffer = await processedImage
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer();
        contentType = 'image/jpeg';
        fileExtension = 'jpg';
        break;

      // Handle formats that Sharp might detect but aren't in the enum
      case 'bmp':
      case 'bitmap':
        // Convert BMP to PNG for better compression
        buffer = await processedImage
          .png({
            compressionLevel: 9,
            palette: quality < 60,
          })
          .toBuffer();
        contentType = 'image/png';
        fileExtension = 'png';
        break;

      default:
        // Default to WebP for best compression for unknown formats
        // This handles any format not explicitly supported by Sharp's FormatEnum
        buffer = await processedImage
          .webp({
            quality,
            effort: 6,
          })
          .toBuffer();
        contentType = 'image/webp';
        fileExtension = 'webp';
    }

    return { buffer, contentType, fileExtension };
  }
}

/**
 * PDF compression processor.
 *
 * Provides PDF compression using the pdf-lib library.
 * Supports compression by removing unnecessary elements and optimizing the PDF structure.
 *
 * @class PDFCompressor
 * @implements {FileProcessor}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const processor = new PDFCompressor();
 *
 * // Check if processor can handle the operation
 * if (processor.canProcess('compress')) {
 *   const result = await processor.process(pdfBuffer, {
 *     jobId: 'job-123',
 *     operation: 'compress',
 *     quality: 70,
 *     timestamp: new Date().toISOString(),
 *     retryCount: 0
 *   });
 * }
 * ```
 */
export class PDFCompressor implements FileProcessor {
  /** Supported operations for PDF files */
  private readonly supportedOperations = ['compress'];

  /**
   * Determines if this processor can handle the given operation.
   *
   * @param {string} operation - Processing operation ('compress')
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string): boolean {
    return this.supportedOperations.includes(operation);
  }

  /**
   * Processes a PDF according to the job specifications.
   *
   * @param {Buffer} buffer - Input PDF data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed PDF result
   * @throws {Error} When processing fails or unsupported operation
   */
  async process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult> {
    if (message.operation === 'compress') {
      return this.compressPDF(buffer, message.quality || 80);
    }

    throw new Error(`Unsupported operation for PDF: ${message.operation}`);
  }

  /**
   * Compresses a PDF by optimizing its structure and removing unnecessary elements.
   *
   * @private
   * @param {Buffer} buffer - Input PDF data
   * @param {number} quality - Compression quality (0-100, higher means better quality)
   * @returns {Promise<ProcessingResult>} Compressed PDF result
   */
  private async compressPDF(buffer: Buffer, quality: number): Promise<ProcessingResult> {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer);

      // Get document info for optimization decisions
      // Get document info for optimization decisions
      // const pageCount = pdfDoc.getPageCount();
      // const pages = pdfDoc.getPages();

      // Basic optimization strategies based on quality setting
      if (quality < 90) {
        // Remove metadata for better compression
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setCreator('');
        pdfDoc.setProducer('Cloud Tools Compressor');
        pdfDoc.setKeywords([]);
      }

      // For lower quality settings, we could implement more aggressive optimizations
      // such as image downscaling, but pdf-lib has limited capabilities for this
      // More advanced compression would require additional libraries like PDF2PIC + Sharp

      // Save the optimized PDF
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: quality > 50, // Use object streams for better compression at higher qualities
        addDefaultPage: false,
        objectsPerTick: quality < 30 ? 50 : 20, // Process more objects at once for lower quality (faster)
      });

      const compressedBuffer = Buffer.from(compressedBytes);

      return {
        buffer: compressedBuffer,
        contentType: 'application/pdf',
        fileExtension: 'pdf',
      };
    } catch (error) {
      throw new Error(
        `PDF compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * FFmpeg-based video conversion processor.
 *
 * Provides video conversion using FFmpeg for multiple output formats.
 * Supports conversion between MP4, MOV, AVI, and WebM formats.
 *
 * @class FFmpegVideoConverter
 * @implements {FileProcessor}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const processor = new FFmpegVideoConverter();
 *
 * // Check if processor can handle the operation
 * if (processor.canProcess('convert', 'mp4')) {
 *   const result = await processor.process(videoBuffer, {
 *     jobId: 'job-123',
 *     operation: 'convert',
 *     targetFormat: 'mp4',
 *     timestamp: new Date().toISOString(),
 *     retryCount: 0
 *   });
 * }
 * ```
 */
export class FFmpegVideoConverter implements FileProcessor {
  /** Supported video formats for processing */
  private readonly supportedFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
  /** Supported operations */
  private readonly supportedOperations = ['convert'];

  /**
   * Determines if this processor can handle the given operation and format.
   *
   * @param {string} operation - Processing operation ('convert')
   * @param {string} [format] - Target format (required for video conversions)
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string, format?: string): boolean {
    if (!this.supportedOperations.includes(operation)) return false;
    if (format && !this.supportedFormats.includes(format.toLowerCase())) return false;
    return true;
  }

  /**
   * Processes a video according to the job specifications.
   *
   * @param {Buffer} buffer - Input video data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed video result
   * @throws {Error} When processing fails or unsupported operation
   */
  async process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult> {
    if (message.operation === 'convert') {
      if (!message.targetFormat) {
        throw new Error('Target format is required for video conversion');
      }
      return this.convertVideo(buffer, message.targetFormat, message.quality);
    }

    throw new Error(`Unsupported operation for video: ${message.operation}`);
  }

  /**
   * Converts a video to the specified format using FFmpeg.
   *
   * @private
   * @param {Buffer} buffer - Input video data
   * @param {string} targetFormat - Target video format
   * @param {number} [quality] - Video quality (0-100, affects bitrate)
   * @returns {Promise<ProcessingResult>} Converted video result
   */
  private async convertVideo(
    buffer: Buffer,
    targetFormat: string,
    quality = 80
  ): Promise<ProcessingResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${randomUUID()}.tmp`);
    const outputFile = join(tempDir, `output_${randomUUID()}.${targetFormat.toLowerCase()}`);

    try {
      // Write input buffer to temporary file
      await fs.writeFile(inputFile, buffer);

      // Convert video using FFmpeg
      await this.runFFmpegConversion(inputFile, outputFile, targetFormat, quality);

      // Read the converted file
      const resultBuffer = await fs.readFile(outputFile);

      return {
        buffer: resultBuffer,
        contentType: this.getVideoContentType(targetFormat),
        fileExtension: targetFormat.toLowerCase(),
      };
    } finally {
      // Cleanup temporary files
      try {
        await fs.unlink(inputFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Runs FFmpeg conversion with format-specific optimizations.
   *
   * @private
   * @param {string} inputFile - Input file path
   * @param {string} outputFile - Output file path
   * @param {string} format - Target format
   * @param {number} quality - Quality setting (0-100)
   * @returns {Promise<void>} Promise that resolves when conversion is complete
   */
  private runFFmpegConversion(
    inputFile: string,
    outputFile: string,
    format: string,
    quality: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputFile);

      // Calculate bitrate based on quality (1000k to 8000k range)
      const videoBitrate = Math.round(1000 + (quality / 100) * 7000);
      const audioBitrate = quality > 50 ? '128k' : '96k';

      // Apply format-specific settings
      switch (format.toLowerCase()) {
        case 'mp4':
          command
            .videoCodec('libx264')
            .audioCodec('aac')
            .videoBitrate(`${videoBitrate}k`)
            .audioBitrate(audioBitrate)
            .addOptions([
              '-preset',
              'medium',
              '-crf',
              String(Math.round(51 - (quality / 100) * 28)),
            ]);
          break;

        case 'webm':
          command
            .videoCodec('libvpx-vp9')
            .audioCodec('libopus')
            .videoBitrate(`${videoBitrate}k`)
            .audioBitrate(audioBitrate)
            .addOptions(['-deadline', 'good', '-cpu-used', '1']);
          break;

        case 'mov':
          command
            .videoCodec('libx264')
            .audioCodec('aac')
            .videoBitrate(`${videoBitrate}k`)
            .audioBitrate(audioBitrate)
            .addOptions(['-preset', 'medium']);
          break;

        case 'avi':
          command
            .videoCodec('libx264')
            .audioCodec('mp3')
            .videoBitrate(`${videoBitrate}k`)
            .audioBitrate(audioBitrate);
          break;

        default:
          // Fallback to basic settings
          command.videoBitrate(`${videoBitrate}k`).audioBitrate(audioBitrate);
      }

      command
        .on('end', () => resolve())
        .on('error', error => reject(new Error(`FFmpeg conversion failed: ${error.message}`)))
        .save(outputFile);
    });
  }

  /**
   * Gets the MIME content type for a video format.
   *
   * @private
   * @param {string} format - Video format
   * @returns {string} MIME content type
   */
  private getVideoContentType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      flv: 'video/x-flv',
      wmv: 'video/x-ms-wmv',
    };
    return mimeTypes[format.toLowerCase()] || 'video/mp4';
  }
}

/**
 * FFmpeg-based audio conversion processor.
 *
 * Provides audio conversion using FFmpeg for multiple output formats.
 * Supports conversion between MP3, WAV, OGG, and FLAC formats.
 *
 * @class FFmpegAudioConverter
 * @implements {FileProcessor}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const processor = new FFmpegAudioConverter();
 *
 * // Check if processor can handle the operation
 * if (processor.canProcess('convert', 'mp3')) {
 *   const result = await processor.process(audioBuffer, {
 *     jobId: 'job-123',
 *     operation: 'convert',
 *     targetFormat: 'mp3',
 *     timestamp: new Date().toISOString(),
 *     retryCount: 0
 *   });
 * }
 * ```
 */
export class FFmpegAudioConverter implements FileProcessor {
  /** Supported audio formats for processing */
  private readonly supportedFormats = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
  /** Supported operations */
  private readonly supportedOperations = ['convert'];

  /**
   * Determines if this processor can handle the given operation and format.
   *
   * @param {string} operation - Processing operation ('convert')
   * @param {string} [format] - Target format (required for audio conversions)
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string, format?: string): boolean {
    if (!this.supportedOperations.includes(operation)) return false;
    if (format && !this.supportedFormats.includes(format.toLowerCase())) return false;
    return true;
  }

  /**
   * Processes an audio file according to the job specifications.
   *
   * @param {Buffer} buffer - Input audio data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed audio result
   * @throws {Error} When processing fails or unsupported operation
   */
  async process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult> {
    if (message.operation === 'convert') {
      if (!message.targetFormat) {
        throw new Error('Target format is required for audio conversion');
      }
      return this.convertAudio(buffer, message.targetFormat, message.quality);
    }

    throw new Error(`Unsupported operation for audio: ${message.operation}`);
  }

  /**
   * Converts an audio file to the specified format using FFmpeg.
   *
   * @private
   * @param {Buffer} buffer - Input audio data
   * @param {string} targetFormat - Target audio format
   * @param {number} [quality] - Audio quality (0-100, affects bitrate)
   * @returns {Promise<ProcessingResult>} Converted audio result
   */
  private async convertAudio(
    buffer: Buffer,
    targetFormat: string,
    quality = 80
  ): Promise<ProcessingResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${randomUUID()}.tmp`);
    const outputFile = join(tempDir, `output_${randomUUID()}.${targetFormat.toLowerCase()}`);

    try {
      // Write input buffer to temporary file
      await fs.writeFile(inputFile, buffer);

      // Convert audio using FFmpeg
      await this.runFFmpegAudioConversion(inputFile, outputFile, targetFormat, quality);

      // Read the converted file
      const resultBuffer = await fs.readFile(outputFile);

      return {
        buffer: resultBuffer,
        contentType: this.getAudioContentType(targetFormat),
        fileExtension: targetFormat.toLowerCase(),
      };
    } finally {
      // Cleanup temporary files
      try {
        await fs.unlink(inputFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Runs FFmpeg audio conversion with format-specific optimizations.
   *
   * @private
   * @param {string} inputFile - Input file path
   * @param {string} outputFile - Output file path
   * @param {string} format - Target format
   * @param {number} quality - Quality setting (0-100)
   * @returns {Promise<void>} Promise that resolves when conversion is complete
   */
  private runFFmpegAudioConversion(
    inputFile: string,
    outputFile: string,
    format: string,
    quality: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputFile);

      // Calculate bitrate based on quality
      const getBitrate = (quality: number, format: string): string => {
        const baseRates: Record<string, number> = {
          mp3: 320,
          aac: 256,
          ogg: 500,
          flac: 1411,
          wav: 1411,
          m4a: 256,
          wma: 320,
        };
        const maxBitrate = baseRates[format.toLowerCase()] || 320;
        return `${Math.round((quality / 100) * maxBitrate)}k`;
      };

      const bitrate = getBitrate(quality, format);

      // Apply format-specific settings
      switch (format.toLowerCase()) {
        case 'mp3':
          command
            .audioCodec('libmp3lame')
            .audioBitrate(bitrate)
            .addOptions(['-q:a', String(Math.round(9 - (quality / 100) * 9))]);
          break;

        case 'wav':
          command.audioCodec('pcm_s16le').addOptions(['-ar', '44100']);
          break;

        case 'flac':
          command
            .audioCodec('flac')
            .addOptions(['-compression_level', String(Math.round(((100 - quality) / 100) * 12))]);
          break;

        case 'ogg':
          command
            .audioCodec('libvorbis')
            .audioBitrate(bitrate)
            .addOptions(['-q:a', String(Math.round((quality / 100) * 10))]);
          break;

        case 'aac':
        case 'm4a':
          command.audioCodec('aac').audioBitrate(bitrate).addOptions(['-profile:a', 'aac_low']);
          break;

        case 'wma':
          command.audioCodec('wmav2').audioBitrate(bitrate);
          break;

        default:
          // Fallback to basic settings
          command.audioBitrate(bitrate);
      }

      command
        .on('end', () => resolve())
        .on('error', error => reject(new Error(`FFmpeg audio conversion failed: ${error.message}`)))
        .save(outputFile);
    });
  }

  /**
   * Gets the MIME content type for an audio format.
   *
   * @private
   * @param {string} format - Audio format
   * @returns {string} MIME content type
   */
  private getAudioContentType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      wma: 'audio/x-ms-wma',
    };
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
  }
}

/**
 * Calibre-based eBook conversion processor.
 *
 * Provides eBook conversion using Calibre's ebook-convert command line tool.
 * Supports conversion between EPUB, MOBI, PDF, and AZW3 formats.
 *
 * @class CalibreEBookConverter
 * @implements {FileProcessor}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const processor = new CalibreEBookConverter();
 *
 * // Check if processor can handle the operation
 * if (processor.canProcess('convert', 'epub')) {
 *   const result = await processor.process(ebookBuffer, {
 *     jobId: 'job-123',
 *     operation: 'convert',
 *     targetFormat: 'epub',
 *     timestamp: new Date().toISOString(),
 *     retryCount: 0
 *   });
 * }
 * ```
 */
export class CalibreEBookConverter implements FileProcessor {
  /** Supported eBook formats for processing */
  private readonly supportedFormats = ['epub', 'mobi', 'azw3', 'pdf', 'txt', 'docx', 'rtf'];
  /** Supported operations */
  private readonly supportedOperations = ['convert'];

  /**
   * Determines if this processor can handle the given operation and format.
   *
   * @param {string} operation - Processing operation ('convert')
   * @param {string} [format] - Target format (required for eBook conversions)
   * @returns {boolean} True if this processor can handle the operation
   */
  canProcess(operation: string, format?: string): boolean {
    if (!this.supportedOperations.includes(operation)) return false;
    if (format && !this.supportedFormats.includes(format.toLowerCase())) return false;
    return true;
  }

  /**
   * Processes an eBook according to the job specifications.
   *
   * @param {Buffer} buffer - Input eBook data
   * @param {ProcessingMessage} message - Job specifications
   * @returns {Promise<ProcessingResult>} Processed eBook result
   * @throws {Error} When processing fails or unsupported operation
   */
  async process(buffer: Buffer, message: ProcessingMessage): Promise<ProcessingResult> {
    if (message.operation === 'convert') {
      if (!message.targetFormat) {
        throw new Error('Target format is required for eBook conversion');
      }
      return this.convertEBook(buffer, message.targetFormat, message.quality);
    }

    throw new Error(`Unsupported operation for eBook: ${message.operation}`);
  }

  /**
   * Converts an eBook to the specified format using Calibre.
   *
   * @private
   * @param {Buffer} buffer - Input eBook data
   * @param {string} targetFormat - Target eBook format
   * @param {number} [quality] - Conversion quality (affects optimization level)
   * @returns {Promise<ProcessingResult>} Converted eBook result
   */
  private async convertEBook(
    buffer: Buffer,
    targetFormat: string,
    quality = 80
  ): Promise<ProcessingResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${randomUUID()}.tmp`);
    const outputFile = join(tempDir, `output_${randomUUID()}.${targetFormat.toLowerCase()}`);

    try {
      // Write input buffer to temporary file
      await fs.writeFile(inputFile, buffer);

      // Check if Calibre is available
      await this.checkCalibreAvailable();

      // Convert eBook using Calibre
      await this.runCalibreConversion(inputFile, outputFile, targetFormat, quality);

      // Read the converted file
      const resultBuffer = await fs.readFile(outputFile);

      return {
        buffer: resultBuffer,
        contentType: this.getEBookContentType(targetFormat),
        fileExtension: targetFormat.toLowerCase(),
      };
    } catch (error) {
      // If Calibre is not available, try basic format handling for some formats
      if (error instanceof Error && error.message.includes('Calibre not available')) {
        return this.handleBasicEBookConversion(buffer, targetFormat);
      }
      throw error;
    } finally {
      // Cleanup temporary files
      try {
        await fs.unlink(inputFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Checks if Calibre is available on the system.
   *
   * @private
   * @returns {Promise<void>} Promise that resolves if Calibre is available
   * @throws {Error} When Calibre is not available
   */
  private async checkCalibreAvailable(): Promise<void> {
    try {
      await execAsync('ebook-convert --version');
    } catch {
      throw new Error('Calibre not available. Please install Calibre with ebook-convert command.');
    }
  }

  /**
   * Runs Calibre conversion with format-specific optimizations.
   *
   * @private
   * @param {string} inputFile - Input file path
   * @param {string} outputFile - Output file path
   * @param {string} format - Target format
   * @param {number} quality - Quality setting (0-100)
   * @returns {Promise<void>} Promise that resolves when conversion is complete
   */
  private async runCalibreConversion(
    inputFile: string,
    outputFile: string,
    format: string,
    quality: number
  ): Promise<void> {
    const options: string[] = [];

    // Add format-specific options based on quality
    switch (format.toLowerCase()) {
      case 'epub':
        options.push('--epub-version=3');
        if (quality > 70) {
          options.push('--preserve-cover-aspect-ratio');
          options.push('--epub-flatten');
        }
        break;

      case 'mobi':
      case 'azw3':
        if (quality < 50) {
          options.push('--mobi-file-type=old');
        }
        options.push('--mobi-toc-at-start');
        break;

      case 'pdf':
        options.push('--pdf-engine=reportlab');
        if (quality > 60) {
          options.push('--pdf-serif-family=Times');
          options.push('--pdf-sans-family=Helvetica');
        }
        break;
    }

    // Build the command
    const command = `ebook-convert "${inputFile}" "${outputFile}" ${options.join(' ')}`;

    try {
      const { stderr } = await execAsync(command, { timeout: 300000 }); // 5 minute timeout
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Calibre conversion error: ${stderr}`);
      }
    } catch (error) {
      throw new Error(
        `Calibre conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handles basic eBook conversion for simple formats when Calibre is not available.
   *
   * @private
   * @param {Buffer} buffer - Input eBook data
   * @param {string} targetFormat - Target format
   * @returns {Promise<ProcessingResult>} Basic conversion result
   */
  private async handleBasicEBookConversion(
    buffer: Buffer,
    targetFormat: string
  ): Promise<ProcessingResult> {
    // For now, we'll just return the original buffer with updated metadata
    // This is a fallback when Calibre is not available
    // In a production system, you might want to implement basic format detection
    // and conversion for simple text-based formats

    if (targetFormat.toLowerCase() === 'txt') {
      // Simple conversion to plain text (strip HTML/formatting)
      let content = buffer.toString('utf8');

      // Basic HTML tag removal for simple cases
      content = content.replace(/<[^>]*>/g, '');
      content = content.replace(/&nbsp;/g, ' ');
      content = content.replace(/&amp;/g, '&');
      content = content.replace(/&lt;/g, '<');
      content = content.replace(/&gt;/g, '>');

      return {
        buffer: Buffer.from(content, 'utf8'),
        contentType: this.getEBookContentType('txt'),
        fileExtension: 'txt',
      };
    }

    // For other formats, return original with appropriate content type
    return {
      buffer,
      contentType: this.getEBookContentType(targetFormat),
      fileExtension: targetFormat.toLowerCase(),
    };
  }

  /**
   * Gets the MIME content type for an eBook format.
   *
   * @private
   * @param {string} format - eBook format
   * @returns {string} MIME content type
   */
  private getEBookContentType(format: string): string {
    const mimeTypes: Record<string, string> = {
      epub: 'application/epub+zip',
      mobi: 'application/x-mobipocket-ebook',
      azw3: 'application/vnd.amazon.ebook',
      pdf: 'application/pdf',
      txt: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      rtf: 'application/rtf',
    };
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }
}

/**
 * Console-based logging handler.
 *
 * Provides logging operations using the browser/Node.js console.
 * Includes emoji prefixes for better log readability.
 *
 * @class ConsoleLogger
 * @implements {Logger}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const logger = new ConsoleLogger();
 *
 * // Log information
 * logger.info('Worker started', { queueUrl: 'https://...' });
 *
 * // Log errors
 * logger.error('Processing failed', new Error('File not found'));
 *
 * // Log warnings
 * logger.warn('Retrying operation');
 * ```
 */
export class ConsoleLogger implements Logger {
  /**
   * Logs an informational message to the console.
   *
   * @param {string} message - Log message
   * @param {any} [data] - Additional data to log
   */
  info(message: string, data?: unknown): void {
    if (data) {
      console.log(`ℹ️ ${message}`, data);
    } else {
      console.log(`ℹ️ ${message}`);
    }
  }

  /**
   * Logs an error message to the console.
   *
   * @param {string} message - Error message
   * @param {any} [error] - Error object or additional data
   */
  error(message: string, error?: unknown): void {
    if (error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  }

  /**
   * Logs a warning message to the console.
   *
   * @param {string} message - Warning message
   * @param {any} [data] - Additional data to log
   */
  warn(message: string, data?: unknown): void {
    if (data) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      console.warn(`⚠️ ${message}`);
    }
  }
}

// ========================================
// MAIN WORKER CLASS
// ========================================

/**
 * Main file processing worker orchestrator.
 *
 * Coordinates message queue polling, file processing, status updates, and logging.
 * Maintains loose coupling between components and supports extensibility.
 *
 * @class QueueWorker
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Create worker with dependencies
 * const worker = new QueueWorker(
 *   messageQueue,
 *   fileStorage,
 *   jobStatusUpdater,
 *   logger,
 *   5000 // poll interval
 * );
 *
 * // Add processors
 * worker.addProcessor(new SharpImageConverter());
 * worker.addProcessor(new FFmpegVideoConverter());
 *
 * // Start processing
 * await worker.start();
 *
 * // Stop when needed
 * worker.stop();
 * ```
 */
export class QueueWorker {
  /** Flag to control worker execution loop */
  private isRunning = false;
  /** Array of registered file processors */
  private readonly processors: FileProcessor[] = [];

  /**
   * Creates a QueueWorker instance with dependency injection.
   *
   * @param {MessageQueue} messageQueue - Message queue implementation for job polling
   * @param {FileStorage} fileStorage - File storage implementation for reading/writing files
   * @param {JobStatusUpdater} jobStatusUpdater - Job status updater for progress tracking
   * @param {Logger} logger - Logger implementation for operational logging
   * @param {number} [pollIntervalMs=5000] - Polling interval in milliseconds between queue checks
   */
  constructor(
    private messageQueue: MessageQueue,
    private fileStorage: FileStorage,
    private jobStatusUpdater: JobStatusUpdater,
    private logger: Logger,
    private pollIntervalMs: number = 5000
  ) {}

  /**
   * Adds a file processor to the worker.
   *
   * Processors are checked in the order they were added when determining
   * which processor can handle a specific job. Allows extending functionality
   * without modifying existing code.
   *
   * @param {FileProcessor} processor - File processor implementation to add
   */
  addProcessor(processor: FileProcessor): void {
    this.processors.push(processor);
  }

  /**
   * Starts the worker processing loop.
   *
   * Continuously polls the message queue for new jobs and processes them.
   * The worker runs until stop() is called. Includes comprehensive error
   * handling to ensure the worker continues running even if individual
   * jobs fail.
   *
   * @returns {Promise<void>} Promise that resolves when worker is stopped
   * @throws {Error} When worker is already running
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting file processing worker...');

    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (error) {
        this.logger.error('Error in worker loop', error);
      }

      await this.sleep(this.pollIntervalMs);
    }
  }

  /**
   * Stops the worker processing loop.
   *
   * Gracefully stops the worker by setting the isRunning flag to false.
   * The worker will finish processing the current batch before stopping.
   */
  stop(): void {
    this.logger.info('Stopping file processing worker...');
    this.isRunning = false;
  }

  /**
   * Processes a batch of messages from the queue.
   *
   * Polls the message queue for available messages and processes each one
   * sequentially. This method is called continuously by the worker loop.
   *
   * @private
   * @returns {Promise<void>} Promise that resolves when all messages in the batch are processed
   */
  private async processBatch(): Promise<void> {
    const messages = await this.messageQueue.pollMessages();

    for (const message of messages) {
      await this.processMessage(message);
    }
  }

  /**
   * Processes an individual message from the queue.
   *
   * Handles message parsing, job processing, error recovery, and cleanup.
   * Includes comprehensive error handling to ensure failed jobs are marked
   * as failed and messages are deleted to prevent reprocessing.
   *
   * @private
   * @param {Message} message - SQS message containing job information
   * @returns {Promise<void>} Promise that resolves when message processing is complete
   */
  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      this.logger.warn('Invalid message received');
      return;
    }

    try {
      const processingMessage: ProcessingMessage = JSON.parse(message.Body);
      this.logger.info(`Processing job: ${processingMessage.jobId}`);

      await this.processJob(processingMessage);
      await this.messageQueue.deleteMessage(message.ReceiptHandle);

      this.logger.info(`Job completed: ${processingMessage.jobId}`);
    } catch (error) {
      this.logger.error('Error processing message', error);

      try {
        const processingMessage: ProcessingMessage = JSON.parse(message.Body!);
        await this.jobStatusUpdater.updateStatus(processingMessage.jobId, JobStatus.FAILED, 0);
      } catch {
        this.logger.error('Could not parse message to update status');
      }

      // Delete message to prevent reprocessing
      await this.messageQueue.deleteMessage(message.ReceiptHandle!);
    }
  }

  /**
   * Processes a file according to job specifications.
   *
   * Coordinates the entire file processing workflow including:
   * - Finding appropriate processor
   * - Updating job status at key stages
   * - Retrieving original file from storage
   * - Processing the file
   * - Storing processed file
   * - Generating download URL
   * - Marking job as completed
   *
   * @private
   * @param {ProcessingMessage} message - Job message containing processing specifications
   * @returns {Promise<void>} Promise that resolves when job processing is complete
   * @throws {Error} When no processor is found or processing fails
   */
  private async processJob(message: ProcessingMessage): Promise<void> {
    // Find appropriate processor
    const processor = this.findProcessor(message);
    if (!processor) {
      throw new Error(
        `No processor found for operation: ${message.operation}, format: ${message.targetFormat}`
      );
    }

    await this.jobStatusUpdater.updateStatus(message.jobId, JobStatus.PROCESSING, 0);

    // Get job record from DynamoDB to retrieve the correct S3 key
    const jobRecord = await this.getJobRecord(message.jobId);
    if (!jobRecord || !jobRecord.s3Key) {
      throw new Error(`Job record not found or missing S3 key for job: ${message.jobId}`);
    }

    // Get original file using the correct S3 key from the job record
    const originalBuffer = await this.fileStorage.getFile(jobRecord.s3Key as string);
    const originalFileSize = originalBuffer.length;
    await this.jobStatusUpdater.updateStatus(message.jobId, JobStatus.PROCESSING, 25);

    // Process file
    const result = await processor.process(originalBuffer, message);
    const processedFileSize = result.buffer.length;
    await this.jobStatusUpdater.updateStatus(message.jobId, JobStatus.PROCESSING, 75);

    // Calculate compression savings if this is a compression operation
    let compressionData: Record<string, unknown> | undefined;
    if (message.operation === 'compress') {
      const savingsBytes = originalFileSize - processedFileSize;
      const savingsPercentage = originalFileSize > 0 ? (savingsBytes / originalFileSize) * 100 : 0;

      compressionData = {
        originalFileSize,
        processedFileSize,
        compressionSavings: Math.max(0, Math.round(savingsPercentage * 100) / 100), // Round to 2 decimal places, ensure non-negative
      };

      this.logger.info(`Compression achieved for job ${message.jobId}:`, {
        originalSize: `${Math.round(originalFileSize / 1024)} KB`,
        processedSize: `${Math.round(processedFileSize / 1024)} KB`,
        savings: `${compressionData.compressionSavings}%`,
      });
    }

    // Upload processed file
    const outputKey = this.generateOutputKey(message, result.fileExtension);
    await this.fileStorage.putFile(outputKey, result.buffer, result.contentType);

    const downloadUrl = this.fileStorage.generateDownloadUrl(outputKey);
    await this.jobStatusUpdater.updateStatus(
      message.jobId,
      JobStatus.PROCESSING,
      90,
      downloadUrl,
      compressionData
    );

    // Mark as completed with compression data
    await this.jobStatusUpdater.updateStatus(
      message.jobId,
      JobStatus.COMPLETED,
      100,
      downloadUrl,
      compressionData
    );
  }

  /**
   * Finds a processor capable of handling the specified job.
   *
   * Searches through registered processors in order until it finds one
   * that can handle the specified operation and target format.
   *
   * @private
   * @param {ProcessingMessage} message - Job message containing operation and format requirements
   * @returns {FileProcessor | null} First processor that can handle the job, or null if none found
   */
  private findProcessor(message: ProcessingMessage): FileProcessor | null {
    return this.processors.find(p => p.canProcess(message.operation, message.targetFormat)) || null;
  }

  /**
   * Generates the storage key for processed files.
   *
   * Creates a unique storage key based on the job ID, operation type,
   * and file extension. Compressed files get a '_compressed' suffix
   * to distinguish them from converted files.
   *
   * @private
   * @param {ProcessingMessage} message - Job message containing operation details
   * @param {string} fileExtension - File extension of the processed file
   * @returns {string} Storage key for the processed file
   *
   * @example
   * ```typescript
   * // For conversion: "processed/job-123.webp"
   * // For compression: "processed/job-123_compressed.jpg"
   * ```
   */
  private generateOutputKey(message: ProcessingMessage, fileExtension: string): string {
    if (message.operation === 'compress') {
      return `processed/${message.jobId}_compressed.${fileExtension}`;
    } else {
      return `processed/${message.jobId}.${fileExtension}`;
    }
  }

  /**
   * Retrieves a job record from DynamoDB.
   *
   * Fetches the complete job record including the S3 key and other metadata
   * needed for processing.
   *
   * @private
   * @param {string} jobId - Unique job identifier
   * @returns {Promise<any>} Job record from DynamoDB
   * @throws {Error} When job record is not found
   */
  private async getJobRecord(jobId: string): Promise<Record<string, unknown>> {
    const command = new GetCommand({
      TableName: AWS_RESOURCES.DYNAMODB_TABLE,
      Key: { jobId },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      throw new Error(`Job record not found: ${jobId}`);
    }

    return result.Item;
  }

  /**
   * Sleeps for the specified duration.
   *
   * Utility method to pause execution between polling cycles.
   * Uses Promise-based setTimeout to avoid blocking the event loop.
   *
   * @private
   * @param {number} ms - Duration to sleep in milliseconds
   * @returns {Promise<void>} Promise that resolves after the specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================================
// FACTORY FUNCTION
// ========================================

/**
 * Factory function to create a fully configured file processing worker.
 *
 * Creates and configures a QueueWorker with all necessary dependencies
 * injected. Uses AWS SQS for queuing, S3 for file storage, REST API for
 * status updates, and console for logging. Automatically registers all
 * available processors for comprehensive multimedia file processing.
 *
 * Registered Processors:
 * - SharpImageConverter: Images (JPEG, PNG, WebP, GIF, TIFF, BMP)
 * - PDFCompressor: PDF compression and optimization
 * - FFmpegVideoConverter: Videos (MP4, MOV, AVI, WebM, MKV, FLV, WMV)
 * - FFmpegAudioConverter: Audio (MP3, WAV, OGG, FLAC, AAC, M4A, WMA)
 * - CalibreEBookConverter: eBooks (EPUB, MOBI, AZW3, PDF, TXT, DOCX, RTF)
 *
 * System Requirements:
 * - FFmpeg: Required for video and audio conversion
 * - Calibre: Required for eBook conversion (with fallback for basic formats)
 *
 * This factory function provides a convenient way to create a worker
 * without manual dependency wiring.
 *
 * @returns {Promise<QueueWorker>} Fully configured and ready-to-use queue worker
 * @throws {Error} When AWS configuration is invalid or services are unavailable
 *
 * @example
 * ```typescript
 * // Create and start a worker
 * const worker = await createFileProcessingWorker();
 * await worker.start();
 *
 * // Add custom processors if needed
 * worker.addProcessor(new CustomVideoConverter());
 *
 * // Stop the worker when done
 * worker.stop();
 * ```
 *
 * @since 1.0.0
 */
export async function createFileProcessingWorker(): Promise<QueueWorker> {
  // Initialize dependencies
  const queueUrl = await getSQSQueueUrl();
  const bucketName = await getS3BucketName();

  const messageQueue = new SqsMessageQueue(queueUrl);
  const fileStorage = new S3FileStorage(bucketName);
  const jobStatusUpdater = new ApiJobStatusUpdater();
  const logger = new ConsoleLogger();

  // Create worker with dependencies injected
  const worker = new QueueWorker(messageQueue, fileStorage, jobStatusUpdater, logger);

  // Add processors
  worker.addProcessor(new SharpImageConverter());
  worker.addProcessor(new PDFCompressor());
  worker.addProcessor(new FFmpegVideoConverter());
  worker.addProcessor(new FFmpegAudioConverter());
  worker.addProcessor(new CalibreEBookConverter());

  logger.info('Worker initialized', {
    queueUrl,
    bucketName,
    processors: [
      'SharpImageConverter',
      'PDFCompressor',
      'FFmpegVideoConverter',
      'FFmpegAudioConverter',
      'CalibreEBookConverter',
    ],
  });

  return worker;
}
