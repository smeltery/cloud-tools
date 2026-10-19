# Lambda Module

This Terraform module creates AWS Lambda functions for file processing operations using your actual TypeScript worker logic.

## Features

- **TypeScript Integration**: Uses your complete `worker.ts` processing logic
- **Production Ready**: Real file processing with Sharp, FFmpeg, PDF, and Calibre support
- **Automatic Building**: Transpiles TypeScript and bundles with esbuild
- **Convert Lambda**: Handles file format conversion via API Gateway
- **Compress Lambda**: Handles file compression operations via API Gateway
- **Process Lambda**: Background processing via SQS messages
- **CloudWatch Logs**: Automatic log group creation and management
- **Environment-specific configuration**: Production vs development settings
- **Dead Letter Queue support**: Failed message handling
- **X-Ray Tracing**: Performance monitoring for production

## Architecture

```text
terraform/modules/lambda/
├── src/                          # TypeScript source code
│   ├── handlers/                 # Lambda function handlers
│   │   ├── convert.ts           # API Gateway conversion handler
│   │   ├── compress.ts          # API Gateway compression handler
│   │   └── process.ts           # SQS processing handler
│   ├── adapters/                # AWS service adapters
│   │   └── aws-lambda-adapter.ts # Lambda-optimized implementations
│   ├── package.json             # Lambda dependencies
│   └── tsconfig.json            # TypeScript configuration
├── build.sh                     # Build script (esbuild + packaging)
├── main.tf                      # Terraform resources
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
└── README.md                    # This file
```

## Usage

```hcl
module "lambda" {
  source = "./modules/lambda"

  project_name               = "cloud-tools"
  environment               = "dev"
  resource_suffix           = "001"
  lambda_execution_role_arn = aws_iam_role.lambda_execution.arn

  environment_variables = {
    S3_BUCKET_NAME     = "my-files-bucket"
    SQS_QUEUE_URL      = "https://sqs.region.amazonaws.com/account/queue-name"
    DYNAMODB_TABLE_NAME = "jobs-table"  # Note: _NAME suffix required
  }

  tags = {
    Environment = "dev"
    Project     = "cloud-tools"
  }
}
```

## Variables

| Variable                    | Type        | Default        | Description                                       |
| --------------------------- | ----------- | -------------- | ------------------------------------------------- |
| `project_name`              | string      | -              | Name of the project                               |
| `environment`               | string      | -              | Environment (dev, staging, prod)                  |
| `resource_suffix`           | string      | -              | Suffix for resource naming                        |
| `lambda_execution_role_arn` | string      | -              | ARN of Lambda execution role                      |
| `lambda_runtime`            | string      | `"nodejs18.x"` | Lambda runtime                                    |
| `lambda_timeout`            | number      | `900`          | Lambda timeout in seconds (15 min for processing) |
| `lambda_memory_size`        | number      | `3008`         | Lambda memory in MB (max for processing)          |
| `environment_variables`     | map(string) | `{}`           | Environment variables                             |
| `tags`                      | map(string) | `{}`           | Resource tags                                     |

## Outputs

| Output                   | Description                          |
| ------------------------ | ------------------------------------ |
| `convert_function_arn`   | ARN of the convert Lambda function   |
| `compress_function_arn`  | ARN of the compress Lambda function  |
| `process_function_arn`   | ARN of the process Lambda function   |
| `convert_function_name`  | Name of the convert Lambda function  |
| `compress_function_name` | Name of the compress Lambda function |
| `process_function_name`  | Name of the process Lambda function  |

## Lambda Functions

### Convert Lambda (`src/handlers/convert.ts`)

- **Purpose**: Real-time file format conversion using your worker.ts logic
- **Trigger**: API Gateway POST requests
- **Features**:
  - All conversion types (image, video, audio, PDF, eBook)
  - CORS support for web applications
  - Progress tracking via DynamoDB
  - S3 integration for file storage

### Compress Lambda (`src/handlers/compress.ts`)

- **Purpose**: File compression and optimization using your worker.ts logic
- **Trigger**: API Gateway POST requests
- **Features**:
  - Image, video, audio, and PDF compression
  - Compression ratio calculation and reporting
  - Quality control parameters

### Process Lambda (`src/handlers/process.ts`)

- **Purpose**: Background processing via SQS using your worker.ts logic
- **Trigger**: SQS messages
- **Features**:
  - Batch message processing
  - All processor types (Sharp, FFmpeg, PDF, Calibre)
  - Automatic retry and error handling

## Environment Variables

The Lambda functions expect these environment variables:

- `S3_BUCKET_NAME`: S3 bucket for file storage
- `SQS_QUEUE_URL`: SQS queue URL for job processing
- `DYNAMODB_TABLE_NAME`: DynamoDB table for job status tracking
- `FUNCTION_NAME`: Set automatically (convert/compress/process)
- `AWS_REGION`: Set automatically by Lambda

## Build Process

The module automatically builds Lambda packages when:

1. **Source Changes**: TypeScript handlers or adapters are modified
2. **Build Script Changes**: The build.sh script is updated
3. **Terraform Apply**: During infrastructure deployment

### Build Steps

1. **TypeScript Compilation**: Uses esbuild for fast, optimized bundling
2. **Dependency Installation**: Installs production dependencies (Sharp, FFmpeg, etc.)
3. **Package Creation**: Creates ZIP files for Lambda deployment
4. **Size Optimization**: Excludes source maps and dev dependencies

### Manual Build

```bash
cd terraform/modules/lambda
./build.sh
```

## Monitoring

- **CloudWatch Logs**: Automatic log groups with 14-day retention
- **Structured Logging**: JSON-formatted logs with timestamps and levels
- **X-Ray Tracing**: Enabled for production environments
- **Dead Letter Queues**: Failed messages routing
- **Progress Tracking**: Real-time job status updates in DynamoDB

## Development

To modify the Lambda functions:

1. **Edit TypeScript**: Modify files in `src/handlers/` or `src/adapters/`
2. **Test Locally**: Use your existing worker.ts tests
3. **Deploy**: Run `terraform apply` (auto-builds and deploys)

### Dependencies

Required tools for building:

- Node.js >= 18.x
- TypeScript (`npm install -g typescript`)
- esbuild (`npm install -g esbuild`)
- zip (system utility)

## Integration Notes

- **Unified Codebase**: Same processing logic for local and Lambda environments
- **Interface-Based**: Easy to test and extend
- **Production Optimized**: Minified bundles with external AWS SDK
- **Error Handling**: Comprehensive error handling and retries
- **Scalability**: Auto-scales with AWS Lambda based on demand

## Migration from Template-Based Approach

This module now uses real TypeScript handlers instead of JavaScript templates:

### Before (Template-Based)

```text
lambda-templates/
├── convert.js      # Basic placeholder code
├── compress.js     # Basic placeholder code
├── process.js      # Basic placeholder code
└── package.json    # Simple dependencies
```

### After (TypeScript Integration)

```text
src/
├── handlers/       # Production TypeScript handlers
├── adapters/       # AWS service integrations
├── package.json    # Full production dependencies
└── tsconfig.json   # TypeScript configuration
```

### Benefits

- **Real Processing**: Actual file conversion/compression using your worker.ts
- **Type Safety**: Full TypeScript support with compile-time checks
- **Code Reuse**: Same logic for local development and Lambda
- **Production Ready**: Comprehensive error handling and monitoring
- **Maintainability**: Single source of truth for processing logic
