# Testing Guide for Cloud Tools

This document provides comprehensive information about the testing setup and available tests for the Cloud Tools application.

## 🧪 Testing Stack

- **Framework**: [Vitest](https://vitest.dev/) - Fast unit test framework built on Vite
- **React Testing**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - Simple and complete testing utilities for React
- **DOM Testing**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) - Custom Jest matchers for DOM elements
- **User Interaction**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) - Advanced user interaction simulation
- **Coverage**: [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) - Code coverage reports using V8
- **UI**: [@vitest/ui](https://vitest.dev/guide/ui.html) - Beautiful testing UI

## 📋 Available Test Scripts

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (default)
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

## 📁 Test Structure

```text
test/
├── setup.ts                           # Global test setup and mocks
├── mocks/
│   └── aws.ts                        # AWS SDK mocks
├── lib/                              # Library/utility tests
│   ├── aws-config.test.ts           # AWS configuration utilities
│   └── utils.test.ts                # General utility functions
├── app/api/                          # API route tests
│   ├── upload/route.test.ts         # File upload API
│   ├── jobs/route.test.ts           # Jobs management API
│   └── process/route.test.ts        # Processing queue API
├── components/                       # React component tests
│   └── file-uploader.test.tsx       # File uploader component
├── integration/                      # Integration tests
│   └── upload-workflow.test.ts      # End-to-end workflow tests
└── README.md                        # This file
```

## 🎯 Test Categories

### 1. Unit Tests (`lib/` directory)

**AWS Configuration Tests** (`lib/aws-config.test.ts`)

- S3 key generation and sanitization
- File type detection and classification
- Job type determination based on file extension
- Environment-specific configuration handling
- Resource URL generation

**Utility Function Tests** (`lib/utils.test.ts`)

- CSS class name combination and merging
- Tailwind CSS conflict resolution
- Conditional class application

### 2. API Route Tests (`app/api/` directory)

**Upload API Tests** (`app/api/upload/route.test.ts`)

- File upload validation and processing
- S3 storage integration
- DynamoDB job record creation
- Error handling for various failure scenarios
- CORS support

**Jobs API Tests** (`app/api/jobs/route.test.ts`)

- Job creation, retrieval, and updates
- Status and progress tracking
- Compression savings calculation
- Database error handling
- Query parameter validation

**Process API Tests** (`app/api/process/route.test.ts`)

- SQS queue message handling
- Job processing workflow initiation
- Queue status monitoring
- Job cancellation logic

### 3. Component Tests (`components/` directory)

**File Uploader Tests** (`components/file-uploader.test.tsx`)

- File selection and validation
- Operation type switching
- User interaction handling
- Multiple file type support
- Error state management

### 4. Integration Tests (`integration/` directory)

**Upload Workflow Tests** (`integration/upload-workflow.test.ts`)

- Complete file processing pipeline
- Multi-service interaction testing
- Error propagation and recovery
- Different file type workflows
- API endpoint coordination

## 🚀 Getting Started

### Prerequisites

Install the testing dependencies:

```bash
npm install --save-dev \
  @testing-library/jest-dom@^6.1.5 \
  @testing-library/react@^14.1.2 \
  @testing-library/user-event@^14.5.1 \
  @vitest/coverage-v8@^1.0.0 \
  @vitest/ui@^1.0.0 \
  jsdom@^23.0.0 \
  vitest@^1.0.0
```

### Running Tests

1. **Quick Test Run**: `npm run test:run`
2. **Development Mode**: `npm test` (watch mode)
3. **With Coverage**: `npm run test:coverage`
4. **With UI**: `npm run test:ui`

### Writing New Tests

1. **Create test files** following the naming convention: `*.test.ts` or `*.test.tsx`
2. **Import necessary testing utilities**:

   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { render, screen, fireEvent } from '@testing-library/react';
   ```

3. **Use the established mocking patterns** from `test/mocks/aws.ts`
4. **Follow the AAA pattern**: Arrange, Act, Assert

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

## 🔧 Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment**: jsdom for DOM testing
- **Setup Files**: Global test setup and mocks
- **Coverage**: V8 provider with comprehensive reporting
- **Path Aliases**: Configured for `@/` imports

### Test Setup (`test/setup.ts`)

- Global environment variable mocking
- AWS SDK mock configuration
- Browser API polyfills (crypto, fetch, FormData, File)
- Console output suppression for cleaner test runs

### AWS Mocking (`test/mocks/aws.ts`)

- Complete AWS SDK client mocking
- S3, DynamoDB, and SQS service mocks
- Mock reset utilities for test isolation

## 📊 Coverage Requirements

- **Target**: 80%+ overall coverage
- **Key Areas**: API routes, utility functions, business logic
- **Exclusions**: Configuration files, type definitions, external dependencies

## 🐛 Debugging Tests

### Common Issues

1. **Mock not working**: Ensure mocks are imported before the tested module
2. **Async issues**: Use `await` with async operations and `waitFor` for DOM updates
3. **Environment variables**: Check `test/setup.ts` for required env vars

### Debugging Tips

```bash
# Run specific test file
npx vitest run test/lib/aws-config.test.ts

# Run with verbose output
VITEST_VERBOSE=true npm test

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/vitest run
```

## 🚀 Continuous Integration

Tests are configured to run in CI environments with:

- Coverage reporting
- JUnit XML output for test results
- Parallel test execution
- Fail-fast on errors

## 📈 Best Practices

1. **Test Naming**: Use descriptive test names that explain the behavior
2. **Test Structure**: Group related tests using `describe` blocks
3. **Mock Management**: Reset mocks between tests to ensure isolation
4. **Async Testing**: Use proper async/await patterns for Promise-based code
5. **User Interactions**: Use `@testing-library/user-event` for realistic interactions
6. **Error Testing**: Always test both success and error scenarios

## 🔗 Useful Links

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [AWS SDK Mocking](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_examples.html)
