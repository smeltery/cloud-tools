import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT } from '@/app/api/jobs/route';
import { resetAllMocks, mockDocSend } from '../../../mocks/aws';
import { JobStatus, JobType } from '@/root-lib/aws-config';
import {
  createMockGetRequest,
  createMockPostRequest,
  createMockPutRequest,
} from '@/test/helpers/nextRequest';

// AWS clients are mocked globally in test/setup.ts

describe('/api/jobs', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET', () => {
    it('should get a specific job by ID', async () => {
      const mockJob = {
        jobId: 'test-job-123',
        fileName: 'test.jpg',
        fileSize: 1024,
        status: JobStatus.PENDING,
        jobType: JobType.IMAGE_CONVERSION,
        operation: 'convert',
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-01T00:00:00Z',
      };

      mockDocSend.mockResolvedValueOnce({ Item: mockJob });

      const request = createMockGetRequest('http://localhost:3000/api/jobs?jobId=test-job-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockJob);

      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'GetCommand',
          TableName: 'TestTable',
          Key: { jobId: 'test-job-123' },
        })
      );
    });

    it('should return 404 for non-existent job', async () => {
      mockDocSend.mockResolvedValueOnce({ Item: undefined });

      const request = createMockGetRequest('http://localhost:3000/api/jobs?jobId=non-existent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });

    it('should list all jobs without filters', async () => {
      const mockJobs = [
        { jobId: 'job-1', status: JobStatus.PENDING },
        { jobId: 'job-2', status: JobStatus.COMPLETED },
      ];

      mockDocSend.mockResolvedValueOnce({ Items: mockJobs });

      const request = createMockGetRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockJobs);
      expect(data.count).toBe(2);

      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'ScanCommand',
          TableName: 'TestTable',
          Limit: 50,
        })
      );
    });

    it('should list jobs with status filter', async () => {
      const mockJobs = [{ jobId: 'job-1', status: JobStatus.COMPLETED }];

      mockDocSend.mockResolvedValueOnce({ Items: mockJobs });

      const request = createMockGetRequest(
        'http://localhost:3000/api/jobs?status=completed&limit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockJobs);

      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'ScanCommand',
          TableName: 'TestTable',
          Limit: 10,
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'completed' },
        })
      );
    });

    it('should handle database error', async () => {
      mockDocSend.mockRejectedValueOnce(new Error('Database error'));

      const request = createMockGetRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve jobs');
      expect(data.details).toBe('Database error');
    });
  });

  describe('POST', () => {
    it('should create a new job successfully', async () => {
      const jobData = {
        jobId: 'test-job-123',
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        s3Key: 'uploads/2023-12-01/test-job-123/test.jpg',
        operation: 'convert',
        targetFormat: 'png',
        jobType: JobType.IMAGE_CONVERSION,
      };

      mockDocSend.mockResolvedValueOnce({});

      const request = createMockPostRequest('http://localhost:3000/api/jobs', jobData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        ...jobData,
        status: JobStatus.PENDING,
        progress: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'PutCommand',
          TableName: 'TestTable',
          Item: expect.objectContaining(jobData),
        })
      );
    });

    it('should return error for missing required fields', async () => {
      const invalidJobData = {
        jobId: 'test-job-123',
        // Missing required fields
      };

      const request = createMockPostRequest('http://localhost:3000/api/jobs', invalidJobData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle database error during job creation', async () => {
      const jobData = {
        jobId: 'test-job-123',
        fileName: 'test.jpg',
        s3Key: 'uploads/test.jpg',
        operation: 'convert',
        jobType: JobType.IMAGE_CONVERSION,
      };

      mockDocSend.mockRejectedValueOnce(new Error('Database error'));

      const request = createMockPostRequest('http://localhost:3000/api/jobs', jobData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create job');
      expect(data.details).toBe('Database error');
    });
  });

  describe('PUT', () => {
    it('should update job status and progress', async () => {
      mockDocSend.mockResolvedValueOnce({});

      const updateData = {
        jobId: 'test-job-123',
        status: JobStatus.PROCESSING,
        progress: 50,
        downloadUrl: 'https://example.com/download/file.jpg',
      };

      const request = createMockPutRequest('http://localhost:3000/api/jobs', updateData);

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: 'UpdateCommand',
          TableName: 'TestTable',
          Key: { jobId: 'test-job-123' },
          UpdateExpression: expect.stringContaining('#updatedAt = :updatedAt'),
          ExpressionAttributeValues: expect.objectContaining({
            ':status': JobStatus.PROCESSING,
            ':progress': 50,
            ':downloadUrl': 'https://example.com/download/file.jpg',
          }),
        })
      );
    });

    it('should update job to completed with timestamp', async () => {
      mockDocSend.mockResolvedValueOnce({});

      const updateData = {
        jobId: 'test-job-123',
        status: JobStatus.COMPLETED,
        progress: 100,
      };

      const request = createMockPutRequest('http://localhost:3000/api/jobs', updateData);

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('completedAt = :completedAt'),
          ExpressionAttributeValues: expect.objectContaining({
            ':completedAt': expect.any(String),
          }),
        })
      );
    });

    it('should update compression savings data', async () => {
      mockDocSend.mockResolvedValueOnce({});

      const updateData = {
        jobId: 'test-job-123',
        originalFileSize: 1000,
        processedFileSize: 600,
        compressionSavings: 40,
      };

      const request = createMockPutRequest('http://localhost:3000/api/jobs', updateData);

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockDocSend).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('originalFileSize = :originalFileSize'),
          ExpressionAttributeValues: expect.objectContaining({
            ':originalFileSize': 1000,
            ':processedFileSize': 600,
            ':compressionSavings': 40,
          }),
        })
      );
    });

    it('should return error for missing jobId', async () => {
      const updateData = {
        status: JobStatus.PROCESSING,
        progress: 50,
      };

      const request = createMockPutRequest('http://localhost:3000/api/jobs', updateData);

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job ID is required');
    });

    it('should handle database error during update', async () => {
      mockDocSend.mockRejectedValueOnce(new Error('Database error'));

      const updateData = {
        jobId: 'test-job-123',
        status: JobStatus.PROCESSING,
      };

      const request = createMockPutRequest('http://localhost:3000/api/jobs', updateData);

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update job');
      expect(data.details).toBe('Database error');
    });
  });
});
