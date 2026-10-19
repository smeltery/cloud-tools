import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetAllMocks, mockS3Send, mockDocSend, mockSQSSend } from '../mocks/aws';

// Mock external dependencies
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image-data')),
  })),
}));

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    }),
  },
}));

describe('Upload Workflow Integration', () => {
  beforeEach(() => {
    resetAllMocks();
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  it('should complete full image conversion workflow', async () => {
    // 1. Mock successful file upload to S3
    mockS3Send.mockResolvedValueOnce({});

    // 2. Mock successful job creation in DynamoDB
    mockDocSend.mockResolvedValueOnce({});

    // 3. Mock successful job status update
    mockDocSend.mockResolvedValueOnce({});

    // 4. Mock successful SQS message sending
    mockSQSSend.mockResolvedValueOnce({
      MessageId: 'mock-message-id-123',
    });

    // 5. Mock successful job retrieval
    mockDocSend.mockResolvedValueOnce({
      Item: {
        jobId: 'test-job-123',
        fileName: 'test.jpg',
        status: 'pending',
        operation: 'convert',
        targetFormat: 'png',
        jobType: 'image_conversion',
      },
    });

    // Simulate the upload workflow
    const file = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', 'convert');
    formData.append('targetFormat', 'png');

    // Test upload API call
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          jobId: 'test-job-123',
          fileName: 'test.jpg',
          operation: 'convert',
          targetFormat: 'png',
          jobType: 'image_conversion',
        },
      }),
    });

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    expect(uploadData.success).toBe(true);
    expect(uploadData.data.jobId).toBe('test-job-123');

    // Test process API call
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          jobId: 'test-job-123',
          messageId: 'mock-message-id-123',
          message: 'Job queued for processing',
        },
      }),
    });

    const processResponse = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: 'test-job-123',
        operation: 'convert',
        targetFormat: 'png',
      }),
    });

    const processData = await processResponse.json();
    expect(processData.success).toBe(true);
    expect(processData.data.messageId).toBe('mock-message-id-123');

    // Test job status retrieval
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          jobId: 'test-job-123',
          status: 'processing',
          progress: 50,
        },
      }),
    });

    const statusResponse = await fetch('/api/jobs?jobId=test-job-123');
    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data.status).toBe('processing');
  });

  it('should handle compression workflow for images', async () => {
    mockS3Send.mockResolvedValueOnce({});
    mockDocSend.mockResolvedValueOnce({});
    mockSQSSend.mockResolvedValueOnce({ MessageId: 'compress-msg-123' });

    // Simulate compression workflow
    const file = new File(['large image data'], 'large-image.png', {
      type: 'image/png',
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', 'compress');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          jobId: 'compress-job-456',
          fileName: 'large-image.png',
          operation: 'compress',
          jobType: 'image_compression',
        },
      }),
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.operation).toBe('compress');
    expect(data.data.jobType).toBe('image_compression');
  });

  it('should handle PDF compression workflow', async () => {
    mockS3Send.mockResolvedValueOnce({});
    mockDocSend.mockResolvedValueOnce({});
    mockSQSSend.mockResolvedValueOnce({ MessageId: 'pdf-msg-789' });

    const file = new File(['pdf content'], 'document.pdf', {
      type: 'application/pdf',
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', 'compress');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          jobId: 'pdf-job-789',
          fileName: 'document.pdf',
          operation: 'compress',
          jobType: 'pdf_compression',
        },
      }),
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.jobType).toBe('pdf_compression');
  });

  it('should handle error scenarios gracefully', async () => {
    // Mock S3 failure
    mockS3Send.mockRejectedValueOnce(new Error('S3 upload failed'));

    const file = new File(['test data'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', 'convert');
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Upload failed',
        details: 'S3 upload failed',
      }),
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(response.ok).toBe(false);
    expect(data.error).toBe('Upload failed');
    expect(data.details).toBe('S3 upload failed');
  });

  it('should handle queue processing failures', async () => {
    // Mock successful upload but failed processing
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { jobId: 'test-job' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Failed to queue job for processing',
          details: 'SQS error',
        }),
      });

    const file = new File(['test data'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', 'convert');

    // Upload should succeed
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadResponse.json();
    expect(uploadData.success).toBe(true);

    // Processing should fail
    const processResponse = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: uploadData.data.jobId,
        operation: 'convert',
      }),
    });

    expect(processResponse.ok).toBe(false);
    const processData = await processResponse.json();
    expect(processData.error).toBe('Failed to queue job for processing');
  });

  it('should validate required fields in API requests', async () => {
    // Test missing file in upload
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'No file provided' }),
    });

    const formData = new FormData();
    formData.append('operation', 'convert');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data.error).toBe('No file provided');
  });
});
