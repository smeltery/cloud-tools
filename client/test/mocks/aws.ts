import { vi } from "vitest";

// Mock functions
export const mockS3Send = vi.fn();
export const mockDynamoSend = vi.fn();
export const mockDocSend = vi.fn();
export const mockSQSSend = vi.fn();

// Mock clients
export const mockS3Client = {
  send: mockS3Send,
};

export const mockDynamoClient = {
  send: mockDynamoSend,
};

export const mockDocClient = {
  send: mockDocSend,
};

export const mockSQSClient = {
  send: mockSQSSend,
};

// Create mock command constructors that work with 'new' keyword
export const mockPutObjectCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "PutObjectCommand" });
});
export const mockGetObjectCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "GetObjectCommand" });
});
export const mockPutCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "PutCommand" });
});
export const mockGetCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "GetCommand" });
});
export const mockScanCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "ScanCommand" });
});
export const mockUpdateCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "UpdateCommand" });
});
export const mockSendMessageCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "SendMessageCommand" });
});
export const mockReceiveMessageCommand = vi.fn(function (
  this: any,
  params: any,
) {
  Object.assign(this, params, { __type: "ReceiveMessageCommand" });
});
export const mockDeleteMessageCommand = vi.fn(function (
  this: any,
  params: any,
) {
  Object.assign(this, params, { __type: "DeleteMessageCommand" });
});
export const mockGetQueueUrlCommand = vi.fn(function (this: any, params: any) {
  Object.assign(this, params, { __type: "GetQueueUrlCommand" });
});

// Mock AWS SDK modules with proper constructor functions
vi.mock("@aws-sdk/client-s3", () => {
  const MockS3Client = vi.fn(function (this: any) {
    return mockS3Client;
  });
  return {
    S3Client: MockS3Client,
    PutObjectCommand: mockPutObjectCommand,
    GetObjectCommand: mockGetObjectCommand,
  };
});

vi.mock("@aws-sdk/client-dynamodb", () => {
  const MockDynamoDBClient = vi.fn(function (this: any) {
    return mockDynamoClient;
  });
  return {
    DynamoDBClient: MockDynamoDBClient,
  };
});

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => mockDocClient),
  },
  PutCommand: mockPutCommand,
  GetCommand: mockGetCommand,
  ScanCommand: mockScanCommand,
  UpdateCommand: mockUpdateCommand,
}));

vi.mock("@aws-sdk/client-sqs", () => {
  const MockSQSClient = vi.fn(function (this: any) {
    return mockSQSClient;
  });
  return {
    SQSClient: MockSQSClient,
    SendMessageCommand: mockSendMessageCommand,
    ReceiveMessageCommand: mockReceiveMessageCommand,
    DeleteMessageCommand: mockDeleteMessageCommand,
    GetQueueUrlCommand: mockGetQueueUrlCommand,
  };
});

// Mock the aws-config module to use our mocked clients
vi.mock("@/root-lib/aws-config", async () => {
  const actual = await vi.importActual("@/root-lib/aws-config");
  return {
    ...actual,
    s3Client: mockS3Client,
    dynamoClient: mockDynamoClient,
    docClient: mockDocClient,
    sqsClient: mockSQSClient,
    AWS_RESOURCES: {
      S3_BUCKET: "test-bucket",
      DYNAMODB_TABLE: "TestTable",
      SQS_QUEUE: "test-queue",
      SQS_QUEUE_URL: "http://localhost:4566/000000000000/test-queue",
    },
  };
});

// Helper to reset all mocks
export const resetAllMocks = () => {
  mockS3Send.mockClear();
  mockDynamoSend.mockClear();
  mockDocSend.mockClear();
  mockSQSSend.mockClear();
};
