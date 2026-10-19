import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for testing
// Use Object.assign to avoid readonly property issue
Object.assign(process.env, { NODE_ENV: 'test' });
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DDB_TABLE_NAME = 'TestTable';
process.env.SQS_QUEUE_NAME = 'test-queue';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock crypto.randomUUID globally
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  },
});

// Mock fetch globally
global.fetch = vi.fn();

// Import and setup AWS mocks before anything else
import './mocks/aws';

// Mock FormData with proper typing
class MockFormData {
  private data = new Map();

  append(key: string, value: unknown) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }

  delete(key: string) {
    this.data.delete(key);
  }

  getAll(key: string) {
    return this.data.has(key) ? [this.data.get(key)] : [];
  }

  has(key: string) {
    return this.data.has(key);
  }

  set(key: string, value: unknown) {
    this.data.set(key, value);
  }

  keys() {
    return this.data.keys();
  }

  values() {
    return this.data.values();
  }

  entries() {
    return this.data.entries();
  }

  forEach(callback: (value: any, key: string, parent: FormData) => void) {
    this.data.forEach((value, key) => callback(value, key, this as any));
  }
}

(global as any).FormData = MockFormData;

// Mock File constructor with proper typing
class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;
  private bits: unknown[];

  constructor(bits: unknown[], filename: string, options: Record<string, any> = {}) {
    this.name = filename;
    this.type = (options.type as string) || 'text/plain';
    this.lastModified = Date.now();
    this.webkitRelativePath = '';
    this.bits = bits;

    // Calculate actual byte size from the bits
    let totalSize = 0;
    for (const bit of bits) {
      if (bit instanceof Uint8Array) {
        totalSize += bit.length;
      } else if (typeof bit === 'string') {
        totalSize += new TextEncoder().encode(bit).length;
      } else {
        totalSize += 1; // fallback for unknown types
      }
    }
    this.size = totalSize;
  }

  arrayBuffer() {
    const buffer = new ArrayBuffer(this.size);
    const view = new Uint8Array(buffer);
    let offset = 0;

    for (const bit of this.bits) {
      if (bit instanceof Uint8Array) {
        view.set(bit, offset);
        offset += bit.length;
      } else if (typeof bit === 'string') {
        const encoded = new TextEncoder().encode(bit);
        view.set(encoded, offset);
        offset += encoded.length;
      }
    }

    return Promise.resolve(buffer);
  }
}

(global as any).File = MockFile;

// Suppress console.log during tests unless explicitly needed
if (process.env.VITEST_VERBOSE !== 'true') {
  console.log = vi.fn();
  console.warn = vi.fn();
}
