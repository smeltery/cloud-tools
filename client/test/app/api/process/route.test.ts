import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/process/route';
import { resetAllMocks, mockS3Send, mockSQSSend, mockDocSend } from '../../../mocks/aws';
import { JobStatus, JobType } from '@/root-lib/aws-config';
import {
  createMockGetRequest,
  createMockPostRequest,
  createMockDeleteRequest,
} from '@/test/helpers/nextRequest';

// Mock the getSQSQueueUrl function
vi.mock('@/root-lib/aws-config', async () => {
  const actual = await vi.importActual('@/root-lib/aws-config');
  return {
    ...actual,
    getSQSQueueUrl: vi.fn().mockResolvedValue('http://localhost:4566/000000000000/test-queue'),
  };
});

// Mock fetch for job status updates
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/process', () => {
  beforeEach(async () => {
    resetAllMocks();
    mockFetch.mockClear();

    // Reset the getSQSQueueUrl mock
    const { getSQSQueueUrl } = await import('@/root-lib/aws-config');
    vi.mocked(getSQSQueueUrl).mockResolvedValue('http://localhost:4566/000000000000/test-queue');
  });

  describe('POST', () => {
    it('should queue a job for processing successfully', async () => {
      const jobData = {
        jobId: 'test-job-123',
        operation: 'convert' as const,
        targetFormat: 'webp',
        quality: 80,
        options: { resize: { width: 800 } },
      };

      // Mock successful SQS send
      mockSQSSend.mockResolvedValueOnce({ MessageId: 'msg-123' });
      // Mock successful job status update
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        jobId: 'test-job-123',
        messageId: 'msg-123',
        message: 'Job queued for processing',
      });

      expect(mockSQSSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'SendMessageCommand',
          MessageBody: expect.stringContaining('"jobId":"test-job-123"'),
          MessageAttributes: expect.objectContaining({
            jobId: {
              StringValue: 'test-job-123',
              DataType: 'String',
            },
            operation: {
              StringValue: 'convert',
              DataType: 'String',
            },
            targetFormat: {
              StringValue: 'webp',
              DataType: 'String',
            },
          }),
        })
      );
    });

    it('should queue a compression job with default quality', async () => {
      const jobData = {
        jobId: 'test-job-456',
        operation: 'compress' as const,
      };

      mockSQSSend.mockResolvedValueOnce({ MessageId: 'msg-456' });
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify message body contains default quality for compression
      const messageBody = JSON.parse(mockSQSSend.mock.calls[0][0].MessageBody);
      expect(messageBody.quality).toBe(80);
      expect(messageBody.operation).toBe('compress');
    });

    it('should return error for missing job ID', async () => {
      const jobData = {
        operation: 'convert',
      };

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID and operation are required');
    });

    it('should return error for missing operation', async () => {
      const jobData = {
        jobId: 'test-job-123',
      };

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID and operation are required');
    });

    it('should return error for invalid operation', async () => {
      const jobData = {
        jobId: 'test-job-123',
        operation: 'invalid',
      };

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid operation. Must be "convert" or "compress"');
    });

    it('should handle SQS failure', async () => {
      const jobData = {
        jobId: 'test-job-123',
        operation: 'convert' as const,
        targetFormat: 'png',
      };

      mockSQSSend.mockRejectedValueOnce(new Error('SQS service unavailable'));

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to queue job for processing');
      expect(data.details).toBe('SQS service unavailable');
    });

    it('should handle job status update failure gracefully', async () => {
      const jobData = {
        jobId: 'test-job-123',
        operation: 'convert' as const,
        targetFormat: 'jpg',
      };

      mockSQSSend.mockResolvedValueOnce({ MessageId: 'msg-123' });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Update failed'),
      });

      const request = createMockPostRequest('http://localhost:3000/api/process', jobData);
      const response = await POST(request);
      const data = await response.json();

      // Should still succeed even if status update fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET', () => {
    it('should return queue status', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/process?action=queue-status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        queueUrl: expect.any(String),
        approximateNumberOfMessages: 0,
        approximateNumberOfMessagesNotVisible: 0,
        status: 'available',
      });
    });

    it('should return error for invalid action', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/process?action=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action. Use ?action=queue-status');
    });

    it('should return error for missing action', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/process');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action. Use ?action=queue-status');
    });

    it('should handle queue status retrieval error', async () => {
      // Mock getSQSQueueUrl to throw an error
      const { getSQSQueueUrl } = await import('@/root-lib/aws-config');
      vi.mocked(getSQSQueueUrl).mockRejectedValueOnce(new Error('SQS service error'));

      const request = createMockGetRequest('http://localhost:3000/api/process?action=queue-status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get queue status');
    });
  });

  describe('DELETE', () => {
    it('should cancel a processing job successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = createMockDeleteRequest(
        'http://localhost:3000/api/process?jobId=test-job-123'
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        jobId: 'test-job-123',
        message: 'Job cancelled and removed from processing queue',
      });

      // Verify job status was updated to failed
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/jobs'),
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: 'test-job-123',
            status: JobStatus.FAILED,
            progress: 0,
          }),
        })
      );
    });

    it('should return error for missing job ID', async () => {
      const request = createMockDeleteRequest('http://localhost:3000/api/process');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID is required');
    });

    it('should handle job cancellation error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = createMockDeleteRequest(
        'http://localhost:3000/api/process?jobId=test-job-123'
      );
      const response = await DELETE(request);
      const data = await response.json();

      // Should still succeed even if status update fails due to network error
      // because updateJobStatus catches and logs errors without rethrowing
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobId).toBe('test-job-123');
    });

    it('should handle job status update failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Update failed'),
      });

      const request = createMockDeleteRequest(
        'http://localhost:3000/api/process?jobId=test-job-123'
      );
      const response = await DELETE(request);
      const data = await response.json();

      // Should still succeed even if status update fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
