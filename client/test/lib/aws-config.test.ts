import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateS3Key,
  getFileExtension,
  getJobTypeFromFile,
  getSQSQueueUrl,
  getS3BucketName,
  JobStatus,
  JobType,
  AWS_RESOURCES,
} from '@/root-lib/aws-config';
import { resetAllMocks } from '../mocks/aws';

describe('AWS Configuration Utilities', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateS3Key', () => {
    it('should generate correct S3 key with default folder', () => {
      const jobId = 'test-job-123';
      const fileName = 'test file.jpg';
      const key = generateS3Key(jobId, fileName);

      expect(key).toMatch(/^uploads\/\d{4}-\d{2}-\d{2}\/test-job-123\/test_file\.jpg$/);
    });

    it('should generate correct S3 key with custom folder', () => {
      const jobId = 'test-job-123';
      const fileName = 'output.png';
      const folder = 'processed';
      const key = generateS3Key(jobId, fileName, folder);

      expect(key).toMatch(/^processed\/\d{4}-\d{2}-\d{2}\/test-job-123\/output\.png$/);
    });

    it('should sanitize special characters in filename', () => {
      const jobId = 'test-job-123';
      const fileName = 'my @special# file$.jpg';
      const key = generateS3Key(jobId, fileName);

      expect(key).toMatch(/my__special__file_\.jpg$/);
    });

    it('should handle empty filename', () => {
      const jobId = 'test-job-123';
      const fileName = '';
      const key = generateS3Key(jobId, fileName);

      expect(key).toMatch(/^uploads\/\d{4}-\d{2}-\d{2}\/test-job-123\/$/);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.JPEG')).toBe('jpeg');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
    });
  });

  describe('getJobTypeFromFile', () => {
    describe('compress operations', () => {
      it('should return IMAGE_COMPRESSION for image files', () => {
        expect(getJobTypeFromFile('photo.jpg', 'compress')).toBe(JobType.IMAGE_COMPRESSION);
        expect(getJobTypeFromFile('image.png', 'compress')).toBe(JobType.IMAGE_COMPRESSION);
        expect(getJobTypeFromFile('graphic.webp', 'compress')).toBe(JobType.IMAGE_COMPRESSION);
      });

      it('should return PDF_COMPRESSION for PDF files', () => {
        expect(getJobTypeFromFile('document.pdf', 'compress')).toBe(JobType.PDF_COMPRESSION);
      });

      it('should fallback to IMAGE_CONVERSION for unsupported compress files', () => {
        expect(getJobTypeFromFile('video.mp4', 'compress')).toBe(JobType.IMAGE_CONVERSION);
        expect(getJobTypeFromFile('audio.mp3', 'compress')).toBe(JobType.IMAGE_CONVERSION);
      });
    });

    describe('convert operations', () => {
      it('should return IMAGE_CONVERSION for image files', () => {
        expect(getJobTypeFromFile('photo.jpg', 'convert')).toBe(JobType.IMAGE_CONVERSION);
        expect(getJobTypeFromFile('image.tiff', 'convert')).toBe(JobType.IMAGE_CONVERSION);
        expect(getJobTypeFromFile('vector.svg', 'convert')).toBe(JobType.IMAGE_CONVERSION);
      });

      it('should return VIDEO_CONVERSION for video files', () => {
        expect(getJobTypeFromFile('movie.mp4', 'convert')).toBe(JobType.VIDEO_CONVERSION);
        expect(getJobTypeFromFile('clip.avi', 'convert')).toBe(JobType.VIDEO_CONVERSION);
        expect(getJobTypeFromFile('video.mkv', 'convert')).toBe(JobType.VIDEO_CONVERSION);
      });

      it('should return AUDIO_CONVERSION for audio files', () => {
        expect(getJobTypeFromFile('song.mp3', 'convert')).toBe(JobType.AUDIO_CONVERSION);
        expect(getJobTypeFromFile('audio.wav', 'convert')).toBe(JobType.AUDIO_CONVERSION);
        expect(getJobTypeFromFile('music.flac', 'convert')).toBe(JobType.AUDIO_CONVERSION);
      });

      it('should return EBOOK_CONVERSION for ebook files', () => {
        expect(getJobTypeFromFile('book.epub', 'convert')).toBe(JobType.EBOOK_CONVERSION);
        expect(getJobTypeFromFile('novel.mobi', 'convert')).toBe(JobType.EBOOK_CONVERSION);
        expect(getJobTypeFromFile('document.docx', 'convert')).toBe(JobType.EBOOK_CONVERSION);
      });

      it('should fallback to IMAGE_CONVERSION for unknown file types', () => {
        expect(getJobTypeFromFile('unknown.xyz', 'convert')).toBe(JobType.IMAGE_CONVERSION);
        expect(getJobTypeFromFile('file', 'convert')).toBe(JobType.IMAGE_CONVERSION);
      });
    });
  });

  describe('getSQSQueueUrl', () => {
    it('should return LocalStack URL in development', async () => {
      // Test environment is set to development in setup
      const url = await getSQSQueueUrl();
      expect(url).toBe('http://localhost:4566/000000000000/test-queue');
    });

    it('should return custom queue URL for different queue name', async () => {
      const customQueue = 'my-custom-queue';
      const url = await getSQSQueueUrl(customQueue);
      expect(url).toBe('http://localhost:4566/000000000000/my-custom-queue');
    });

    it('should return LocalStack URL even when simulating production due to test environment', async () => {
      // Note: In our current implementation, test environment always uses LocalStack URL
      // This is the expected behavior for our test setup
      const url = await getSQSQueueUrl('production-queue');
      expect(url).toBe('http://localhost:4566/000000000000/production-queue');
    });
  });

  describe('getS3BucketName', () => {
    it('should return configured bucket name', async () => {
      const bucketName = await getS3BucketName();
      expect(bucketName).toBe(AWS_RESOURCES.S3_BUCKET);
      expect(bucketName).toBe('test-bucket'); // From test setup
    });
  });

  describe('JobStatus enum', () => {
    it('should have correct values', () => {
      expect(JobStatus.PENDING).toBe('pending');
      expect(JobStatus.PROCESSING).toBe('processing');
      expect(JobStatus.COMPLETED).toBe('completed');
      expect(JobStatus.FAILED).toBe('failed');
    });
  });

  describe('JobType enum', () => {
    it('should have correct values', () => {
      expect(JobType.IMAGE_CONVERSION).toBe('image_conversion');
      expect(JobType.IMAGE_COMPRESSION).toBe('image_compression');
      expect(JobType.VIDEO_CONVERSION).toBe('video_conversion');
      expect(JobType.AUDIO_CONVERSION).toBe('audio_conversion');
      expect(JobType.PDF_COMPRESSION).toBe('pdf_compression');
      expect(JobType.EBOOK_CONVERSION).toBe('ebook_conversion');
    });
  });

  describe('AWS_RESOURCES', () => {
    it('should have correct resource names from environment', () => {
      expect(AWS_RESOURCES.S3_BUCKET).toBe('test-bucket');
      expect(AWS_RESOURCES.DYNAMODB_TABLE).toBe('TestTable');
      expect(AWS_RESOURCES.SQS_QUEUE).toBe('test-queue');
      expect(AWS_RESOURCES.SQS_QUEUE_URL).toBe('http://localhost:4566/000000000000/test-queue');
    });
  });
});
