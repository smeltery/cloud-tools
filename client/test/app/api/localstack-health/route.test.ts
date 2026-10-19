import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/localstack-health/route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Helper function to create a mock NextRequest
function createMockRequest(url = 'http://localhost:3000/api/localstack-health') {
  return {
    url,
    method: 'GET',
  } as Request;
}

describe('/api/localstack-health', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('GET', () => {
    it('should return LocalStack health status when LocalStack is available', async () => {
      const mockHealthData = {
        services: {
          s3: 'available',
          dynamodb: 'available',
          sqs: 'available',
          lambda: 'available',
        },
        version: '2.3.2',
        edition: 'community',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthData),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHealthData);

      // Verify correct headers are set
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4566/_localstack/health',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should return error when LocalStack returns non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'LocalStack health check failed',
        status: 503,
      });
    });

    it('should return error when LocalStack is unreachable', async () => {
      const connectionError = new Error('Connection refused');
      mockFetch.mockRejectedValueOnce(connectionError);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Failed to connect to LocalStack',
        message: 'Connection refused',
        services: {},
      });

      expect(console.error).toHaveBeenCalledWith('LocalStack health check error:', connectionError);
    });

    it('should handle LocalStack timeout', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Failed to connect to LocalStack',
        message: 'The operation was aborted',
        services: {},
      });
    });

    it('should handle invalid JSON response from LocalStack', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected token')),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Failed to connect to LocalStack',
        message: 'Unexpected token',
        services: {},
      });
    });

    it('should handle empty response from LocalStack', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({});

      // Verify cache headers are still set
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should handle partial LocalStack services', async () => {
      const partialHealthData = {
        services: {
          s3: 'available',
          dynamodb: 'error',
          sqs: 'available',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(partialHealthData),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(partialHealthData);
    });

    it('should handle network timeout specifically', async () => {
      vi.useFakeTimers();

      // Create a promise that never resolves to simulate timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      mockFetch.mockReturnValueOnce(timeoutPromise);

      const responsePromise = GET();

      // Fast forward time to trigger timeout
      vi.advanceTimersByTime(5000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Failed to connect to LocalStack');

      vi.useRealTimers();
    });

    it('should preserve LocalStack error details when available', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'LocalStack health check failed',
        status: 500,
      });
    });

    it('should handle different HTTP error codes from LocalStack', async () => {
      const testCases = [
        { status: 400, expected: 400 },
        { status: 401, expected: 401 },
        { status: 404, expected: 404 },
        { status: 500, expected: 500 },
        { status: 502, expected: 502 },
        { status: 503, expected: 503 },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
        });

        const response = await GET();

        expect(response.status).toBe(testCase.expected);

        const data = await response.json();
        expect(data.error).toBe('LocalStack health check failed');
        expect(data.status).toBe(testCase.status);
      }
    });
  });
});
