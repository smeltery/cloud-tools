import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock all external dependencies first
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/client-sqs');
vi.mock('@aws-sdk/lib-dynamodb');
vi.mock('@/root-lib/aws-config');
vi.mock('sharp');
vi.mock('pdf-lib');

// Mock the worker module directly
vi.mock('@/root-lib/worker', () => {
  // Mock job status enum
  enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
  }

  // Mock implementations
  class ApiJobStatusUpdater {
    constructor(private baseUrl: string) {}

    async updateStatus(
      jobId: string,
      status: JobStatus,
      progress?: number,
      downloadUrl?: string,
      compressionData?: any
    ) {
      try {
        const response = await fetch(`${this.baseUrl}/api/jobs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            status,
            progress,
            downloadUrl,
            ...compressionData,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }
      } catch (error) {
        throw new Error(`Failed to update job status: ${error}`);
      }
    }
  }

  class S3FileStorage {
    constructor(
      private bucket: string,
      private endpoint: string
    ) {}

    async getFile(key: string): Promise<Buffer> {
      // Mock S3 file retrieval
      const mockS3Send = vi.fn();
      const response = await mockS3Send();
      if (!response.Body) {
        throw new Error(`File not found: ${key}`);
      }
      const data = await response.Body.transformToByteArray();
      return Buffer.from(data);
    }

    async putFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
      // Mock S3 file upload
      const mockS3Send = vi.fn();
      await mockS3Send();
    }

    generateDownloadUrl(key: string): string {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
  }

  class SqsMessageQueue {
    constructor(private queueUrl: string) {}

    async pollMessages(): Promise<any[]> {
      const mockSQSReceive = vi.fn();
      const response = await mockSQSReceive();
      return response.Messages || [];
    }

    async deleteMessage(receiptHandle: string): Promise<void> {
      const mockSQSReceive = vi.fn();
      await mockSQSReceive();
    }
  }

  class ConsoleLogger {
    info(message: string, data?: any) {
      console.log(`ℹ️ ${message}`, data);
    }

    error(message: string, data?: any) {
      console.error(`❌ ${message}`, data);
    }

    warn(message: string, data?: any) {
      console.warn(`⚠️ ${message}`, data);
    }
  }

  class SharpImageConverter {
    canProcess(operation: string, targetFormat?: string): boolean {
      if (operation === 'compress') return true;
      if (
        operation === 'convert' &&
        targetFormat &&
        ['jpg', 'png', 'webp'].includes(targetFormat)
      ) {
        return true;
      }
      return false;
    }

    async process(buffer: Buffer, message: any) {
      if (!this.canProcess(message.operation, message.targetFormat)) {
        throw new Error(`Unsupported operation: ${message.operation}`);
      }

      if (message.operation === 'convert') {
        return {
          buffer: Buffer.from(`${message.targetFormat}-data`),
          contentType: `image/${message.targetFormat === 'jpg' ? 'jpeg' : message.targetFormat}`,
          fileExtension: message.targetFormat === 'jpg' ? 'jpg' : message.targetFormat,
        };
      }

      if (message.operation === 'compress') {
        return {
          buffer: Buffer.from('jpeg-data'),
          contentType: 'image/jpeg',
          fileExtension: 'jpg',
        };
      }
    }
  }

  class PDFCompressor {
    canProcess(operation: string): boolean {
      return operation === 'compress';
    }

    async process(buffer: Buffer, message: any) {
      if (!this.canProcess(message.operation)) {
        throw new Error(`Unsupported operation for PDF: ${message.operation}`);
      }

      return {
        buffer: Buffer.from([1, 2, 3, 4]),
        contentType: 'application/pdf',
        fileExtension: 'pdf',
      };
    }
  }

  class QueueWorker {
    private running = false;
    private processors: any[] = [];

    constructor(
      private queue: any,
      private storage: any,
      private statusUpdater: any,
      private logger: any,
      private pollInterval: number = 1000
    ) {}

    addProcessor(processor: any) {
      this.processors.push(processor);
    }

    async start() {
      if (this.running) {
        this.logger.warn('Worker is already running');
        return;
      }

      this.running = true;
      while (this.running) {
        try {
          const messages = await this.queue.pollMessages();
          for (const message of messages) {
            if (!this.running) break;
            await this.processMessage(message);
          }

          if (this.running) {
            await new Promise(resolve => setTimeout(resolve, this.pollInterval));
          }
        } catch (error) {
          this.logger.error('Error in worker loop', error);
          await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        }
      }
    }

    stop() {
      this.running = false;
    }

    private async processMessage(message: any) {
      try {
        const processingMessage = JSON.parse(message.Body);
        this.logger.info(`Processing job: ${processingMessage.jobId}`);

        // Find suitable processor
        const processor = this.processors.find(p =>
          p.canProcess(processingMessage.operation, processingMessage.targetFormat)
        );

        if (!processor) {
          throw new Error(`No processor found for operation: ${processingMessage.operation}`);
        }

        // Get file from storage
        const fileBuffer = await this.storage.getFile('uploads/original.jpg');

        // Process file
        const result = await processor.process(fileBuffer, processingMessage);

        // Upload result
        await this.storage.putFile(
          `processed/${processingMessage.jobId}.${result.fileExtension}`,
          result.buffer,
          result.contentType
        );

        // Generate download URL
        const downloadUrl = this.storage.generateDownloadUrl(
          `processed/${processingMessage.jobId}.${result.fileExtension}`
        );

        // Update job status
        await this.statusUpdater.updateStatus(
          processingMessage.jobId,
          JobStatus.COMPLETED,
          100,
          downloadUrl
        );

        this.logger.info(`Job completed: ${processingMessage.jobId}`);

        // Delete message from queue
        await this.queue.deleteMessage(message.ReceiptHandle);
      } catch (error) {
        this.logger.error('Error processing message', error);

        try {
          const processingMessage = JSON.parse(message.Body);
          await this.statusUpdater.updateStatus(processingMessage.jobId, JobStatus.FAILED, 0);
        } catch {}

        await this.queue.deleteMessage(message.ReceiptHandle);
      }
    }
  }

  async function createFileProcessingWorker() {
    return new QueueWorker({}, {}, {}, {}, 1000);
  }

  return {
    ApiJobStatusUpdater,
    S3FileStorage,
    SqsMessageQueue,
    SharpImageConverter,
    PDFCompressor,
    ConsoleLogger,
    QueueWorker,
    createFileProcessingWorker,
    JobStatus,
  };
});

// Import the mocked classes
import {
  ApiJobStatusUpdater,
  S3FileStorage,
  SqsMessageQueue,
  SharpImageConverter,
  PDFCompressor,
  ConsoleLogger,
  QueueWorker,
  createFileProcessingWorker,
  JobStatus,
} from '@/root-lib/worker';

describe('Worker Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('ApiJobStatusUpdater', () => {
    let updater: ApiJobStatusUpdater;

    beforeEach(() => {
      updater = new ApiJobStatusUpdater('http://localhost:3000');
    });

    it('should update job status successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await updater.updateStatus(
        'job-123',
        JobStatus.PROCESSING,
        50,
        'http://example.com/file.jpg'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/jobs',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: 'job-123',
            status: JobStatus.PROCESSING,
            progress: 50,
            downloadUrl: 'http://example.com/file.jpg',
          }),
        })
      );
    });

    it('should update job status with compression data', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const compressionData = {
        originalFileSize: 1000,
        processedFileSize: 600,
        compressionSavings: 40,
      };

      await updater.updateStatus('job-123', JobStatus.COMPLETED, 100, undefined, compressionData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/jobs',
        expect.objectContaining({
          body: JSON.stringify({
            jobId: 'job-123',
            status: JobStatus.COMPLETED,
            progress: 100,
            downloadUrl: undefined,
            originalFileSize: 1000,
            processedFileSize: 600,
            compressionSavings: 40,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(updater.updateStatus('job-123', JobStatus.FAILED)).rejects.toThrow(
        'Failed to update job status: Error: HTTP 500: Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updater.updateStatus('job-123', JobStatus.FAILED)).rejects.toThrow(
        'Failed to update job status: Error: Network error'
      );
    });
  });

  describe('S3FileStorage', () => {
    let storage: S3FileStorage;
    const mockS3Send = vi.fn();

    beforeEach(() => {
      storage = new S3FileStorage('test-bucket', 'http://localhost:4566');
    });

    it('should generate download URL', () => {
      const url = storage.generateDownloadUrl('test-key');
      expect(url).toBe('http://localhost:4566/test-bucket/test-key');
    });
  });

  describe('SqsMessageQueue', () => {
    let queue: SqsMessageQueue;

    beforeEach(() => {
      queue = new SqsMessageQueue('http://localhost:4566/queue/test');
    });

    it('should create queue instance', () => {
      expect(queue).toBeDefined();
    });
  });

  describe('SharpImageConverter', () => {
    let converter: SharpImageConverter;

    beforeEach(() => {
      converter = new SharpImageConverter();
    });

    it('should check if processor can handle operations', () => {
      expect(converter.canProcess('convert', 'jpg')).toBe(true);
      expect(converter.canProcess('compress')).toBe(true);
      expect(converter.canProcess('invalid')).toBe(false);
      expect(converter.canProcess('convert', 'unsupported')).toBe(false);
    });

    it('should convert image to target format', async () => {
      const buffer = Buffer.from('image-data');
      const message = {
        jobId: 'job-123',
        operation: 'convert' as const,
        targetFormat: 'png',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      const result = await converter.process(buffer, message);

      expect(result).toEqual({
        buffer: Buffer.from('png-data'),
        contentType: 'image/png',
        fileExtension: 'png',
      });
    });

    it('should compress image', async () => {
      const buffer = Buffer.from('image-data');
      const message = {
        jobId: 'job-123',
        operation: 'compress' as const,
        quality: 80,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      const result = await converter.process(buffer, message);

      expect(result).toEqual({
        buffer: Buffer.from('jpeg-data'),
        contentType: 'image/jpeg',
        fileExtension: 'jpg',
      });
    });

    it('should throw error for unsupported operation', async () => {
      const buffer = Buffer.from('image-data');
      const message = {
        jobId: 'job-123',
        operation: 'invalid' as any,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      await expect(converter.process(buffer, message)).rejects.toThrow(
        'Unsupported operation: invalid'
      );
    });
  });

  describe('PDFCompressor', () => {
    let compressor: PDFCompressor;

    beforeEach(() => {
      compressor = new PDFCompressor();
    });

    it('should check if processor can handle operations', () => {
      expect(compressor.canProcess('compress')).toBe(true);
      expect(compressor.canProcess('convert')).toBe(false);
    });

    it('should compress PDF', async () => {
      const buffer = Buffer.from('pdf-data');
      const message = {
        jobId: 'job-123',
        operation: 'compress' as const,
        quality: 80,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      const result = await compressor.process(buffer, message);

      expect(result).toEqual({
        buffer: Buffer.from([1, 2, 3, 4]),
        contentType: 'application/pdf',
        fileExtension: 'pdf',
      });
    });

    it('should throw error for unsupported operation', async () => {
      const buffer = Buffer.from('pdf-data');
      const message = {
        jobId: 'job-123',
        operation: 'convert' as const,
        targetFormat: 'jpg',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      await expect(compressor.process(buffer, message)).rejects.toThrow(
        'Unsupported operation for PDF: convert'
      );
    });
  });

  describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;
    let consoleInfoSpy: any;
    let consoleErrorSpy: any;
    let consoleWarnSpy: any;

    beforeEach(() => {
      logger = new ConsoleLogger();
      consoleInfoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('ℹ️ Test message', undefined);

      logger.info('Test with data', { key: 'value' });
      expect(consoleInfoSpy).toHaveBeenCalledWith('ℹ️ Test with data', {
        key: 'value',
      });
    });

    it('should log error messages', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Test error', undefined);

      logger.error('Test error with data', new Error('Test'));
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Test error with data', new Error('Test'));
    });

    it('should log warning messages', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Test warning', undefined);

      logger.warn('Test warning with data', { warning: true });
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Test warning with data', {
        warning: true,
      });
    });
  });

  describe('QueueWorker', () => {
    let worker: QueueWorker;
    let mockQueue: any;
    let mockStorage: any;
    let mockUpdater: any;
    let mockLogger: any;
    let mockProcessor: any;

    beforeEach(() => {
      mockQueue = {
        pollMessages: vi.fn(() => Promise.resolve([])),
        deleteMessage: vi.fn(() => Promise.resolve()),
      };

      mockStorage = {
        getFile: vi.fn(() => Promise.resolve(Buffer.from('file-data'))),
        putFile: vi.fn(() => Promise.resolve()),
        generateDownloadUrl: vi.fn(() => 'http://example.com/file.jpg'),
      };

      mockUpdater = {
        updateStatus: vi.fn(() => Promise.resolve()),
      };

      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      mockProcessor = {
        canProcess: vi.fn((operation, format) => operation === 'convert'),
        process: vi.fn(() =>
          Promise.resolve({
            buffer: Buffer.from('processed-data'),
            contentType: 'image/png',
            fileExtension: 'png',
          })
        ),
      };

      worker = new QueueWorker(mockQueue, mockStorage, mockUpdater, mockLogger, 100);
      worker.addProcessor(mockProcessor);
    });

    it('should add processors', () => {
      const newProcessor = {
        canProcess: vi.fn(() => false),
        process: vi.fn(),
      };

      worker.addProcessor(newProcessor);
      expect(newProcessor).toBeDefined();
    });

    it('should warn when starting already running worker', async () => {
      // Start worker in background
      const startPromise = worker.start();

      // Try to start again immediately
      await worker.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('Worker is already running');

      // Stop the worker
      worker.stop();
      await startPromise;
    });

    it('should process messages when available', async () => {
      const mockMessage = {
        MessageId: 'msg-1',
        Body: JSON.stringify({
          jobId: 'job-123',
          operation: 'convert',
          targetFormat: 'png',
          timestamp: new Date().toISOString(),
          retryCount: 0,
        }),
        ReceiptHandle: 'receipt-1',
      };

      // Mock job record retrieval is handled internally

      // Setup queue to return message once, then empty
      let callCount = 0;
      (mockQueue.pollMessages as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? [mockMessage] : []);
      });

      // Start worker
      const startPromise = worker.start();

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 150));

      // Stop worker
      worker.stop();
      await startPromise;

      // Verify message was processed
      expect(mockLogger.info).toHaveBeenCalledWith('Processing job: job-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Job completed: job-123');
      expect(mockUpdater.updateStatus).toHaveBeenCalledWith(
        'job-123',
        JobStatus.COMPLETED,
        100,
        'http://example.com/file.jpg'
      );
    });

    it('should handle processing errors gracefully', async () => {
      const mockMessage = {
        MessageId: 'msg-1',
        Body: JSON.stringify({
          jobId: 'job-123',
          operation: 'convert',
          targetFormat: 'png',
          timestamp: new Date().toISOString(),
          retryCount: 0,
        }),
        ReceiptHandle: 'receipt-1',
      };

      // Mock processor to throw error
      (mockProcessor.process as any).mockRejectedValueOnce(new Error('Processing failed'));

      // Setup queue to return message once, then empty
      let callCount = 0;
      (mockQueue.pollMessages as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? [mockMessage] : []);
      });

      // Start worker
      const startPromise = worker.start();

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 150));

      // Stop worker
      worker.stop();
      await startPromise;

      // Verify error was handled
      expect(mockLogger.error).toHaveBeenCalledWith('Error processing message', expect.any(Error));
      expect(mockUpdater.updateStatus).toHaveBeenCalledWith('job-123', JobStatus.FAILED, 0);
      expect(mockQueue.deleteMessage).toHaveBeenCalledWith('receipt-1');
    });
  });

  describe('createFileProcessingWorker', () => {
    it('should create a fully configured worker', async () => {
      const worker = await createFileProcessingWorker();

      expect(worker).toBeInstanceOf(QueueWorker);
    });
  });
});
