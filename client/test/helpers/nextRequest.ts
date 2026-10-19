import { vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest object for testing
 */
export function createMockNextRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  // Create a mock request that satisfies NextRequest interface
  const parsedUrl = new URL(url);

  const request = {
    url,
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : null,
    json: vi.fn().mockResolvedValue(body || {}),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body || '')),
    formData: vi.fn().mockResolvedValue(new FormData()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: vi.fn().mockResolvedValue(new Blob()),
    clone: vi.fn().mockReturnThis(),
    signal: new AbortController().signal,
    nextUrl: parsedUrl,
    cookies: {
      get: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
      has: vi.fn().mockReturnValue(false),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      size: 0,
      [Symbol.iterator]: vi.fn().mockReturnValue([][Symbol.iterator]()),
    },
    geo: {
      city: 'Test City',
      country: 'US',
      region: 'CA',
    },
    ip: '127.0.0.1',
    referrer: '',
    referrerPolicy: '' as const,
    bodyUsed: false,
    cache: 'default' as const,
    credentials: 'same-origin' as const,
    destination: '' as const,
    integrity: '',
    keepalive: false,
    mode: 'cors' as const,
    redirect: 'follow' as const,
  };

  return request as unknown as NextRequest;
}

/**
 * Create a mock GET NextRequest
 */
export function createMockGetRequest(
  url: string,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest(url, { method: 'GET', headers });
}

/**
 * Create a mock POST NextRequest with JSON body
 */
export function createMockPostRequest(
  url: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Create a mock PUT NextRequest with JSON body
 */
export function createMockPutRequest(
  url: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest(url, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Create a mock DELETE NextRequest
 */
export function createMockDeleteRequest(
  url: string,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest(url, { method: 'DELETE', headers });
}
