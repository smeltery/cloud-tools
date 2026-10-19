terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
  }
}

# Build TypeScript Lambda deployment packages
# This uses our enhanced build script to create production-ready packages
resource "null_resource" "build_lambda_packages" {
  triggers = {
    # Rebuild when source files change
    handlers_hash = filemd5("${path.module}/src/handlers/convert.ts")
    adapter_hash  = filemd5("${path.module}/src/adapters/aws-lambda-adapter.ts")
    build_script  = filemd5("${path.module}/build.sh")
  }

  provisioner "local-exec" {
    command     = "./build.sh"
    working_dir = path.module
  }
}

# Use the built ZIP packages directly
locals {
  convert_lambda_path  = "${path.module}/.build/lambda/convert-lambda.zip"
  compress_lambda_path = "${path.module}/.build/lambda/compress-lambda.zip"
  process_lambda_path  = "${path.module}/.build/lambda/process-lambda.zip"
}

# Convert Lambda function
resource "aws_lambda_function" "convert" {
  filename         = local.convert_lambda_path
  function_name    = "${var.project_name}-convert-${var.environment}-${var.resource_suffix}"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"
  source_code_hash = data.local_file.convert_package.content_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  depends_on = [null_resource.build_lambda_packages]

  # CKV_AWS_115: Configure function-level concurrent execution limit
  reserved_concurrent_executions = var.environment == "production" ? 100 : 10

  # CKV_AWS_272: Configure code-signing
  code_signing_config_arn = var.code_signing_config_arn

  # CKV_AWS_117: Configure Lambda inside VPC for production
  dynamic "vpc_config" {
    for_each = var.environment == "production" ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  environment {
    variables = merge(var.environment_variables, {
      FUNCTION_NAME = "convert"
    })
  }

  # Encrypt environment variables
  kms_key_arn = var.kms_key_id

  # Enable X-Ray tracing for performance monitoring
  tracing_config {
    mode = var.environment == "production" ? "Active" : "PassThrough"
  }

  # Enable dead letter queue configuration
  dead_letter_config {
    target_arn = replace(var.environment_variables["SQS_QUEUE_URL"], "cloud-tools-jobs-queue", "cloud-tools-jobs-queue-dlq")
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-${var.environment}-convert-function"
    Type     = "FileConversion"
    Function = "convert"
  })
}

# Compress Lambda function
resource "aws_lambda_function" "compress" {
  filename         = local.compress_lambda_path
  function_name    = "${var.project_name}-compress-${var.environment}-${var.resource_suffix}"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"
  source_code_hash = data.local_file.compress_package.content_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  depends_on = [null_resource.build_lambda_packages]

  # CKV_AWS_115: Configure function-level concurrent execution limit
  reserved_concurrent_executions = var.environment == "production" ? 100 : 10

  # CKV_AWS_272: Configure code-signing
  code_signing_config_arn = var.code_signing_config_arn

  # CKV_AWS_117: Configure Lambda inside VPC for production
  dynamic "vpc_config" {
    for_each = var.environment == "production" ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  environment {
    variables = merge(var.environment_variables, {
      FUNCTION_NAME = "compress"
    })
  }

  # Encrypt environment variables
  kms_key_arn = var.kms_key_id

  tracing_config {
    mode = var.environment == "production" ? "Active" : "PassThrough"
  }

  dead_letter_config {
    target_arn = replace(var.environment_variables["SQS_QUEUE_URL"], "cloud-tools-jobs-queue", "cloud-tools-jobs-queue-dlq")
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-${var.environment}-compress-function"
    Type     = "FileCompression"
    Function = "compress"
  })
}

# Process Lambda function (for SQS processing)
resource "aws_lambda_function" "process" {
  filename         = local.process_lambda_path
  function_name    = "${var.project_name}-process-${var.environment}-${var.resource_suffix}"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"
  source_code_hash = data.local_file.process_package.content_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  depends_on = [null_resource.build_lambda_packages]

  # CKV_AWS_115: Configure function-level concurrent execution limit
  reserved_concurrent_executions = var.environment == "production" ? 100 : 10

  # CKV_AWS_272: Configure code-signing
  code_signing_config_arn = var.code_signing_config_arn

  # CKV_AWS_117: Configure Lambda inside VPC for production
  dynamic "vpc_config" {
    for_each = var.environment == "production" ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  environment {
    variables = merge(var.environment_variables, {
      FUNCTION_NAME = "process"
    })
  }

  # Encrypt environment variables
  kms_key_arn = var.kms_key_id

  tracing_config {
    mode = var.environment == "production" ? "Active" : "PassThrough"
  }

  dead_letter_config {
    target_arn = replace(var.environment_variables["SQS_QUEUE_URL"], "cloud-tools-jobs-queue", "cloud-tools-jobs-queue-dlq")
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-${var.environment}-process-function"
    Type     = "FileProcessing"
    Function = "process"
  })
}

# CloudWatch log groups for Lambda functions
# CKV_AWS_338: Ensure CloudWatch log groups retains logs for at least 1 year
resource "aws_cloudwatch_log_group" "convert" {
  name              = "/aws/lambda/${aws_lambda_function.convert.function_name}"
  retention_in_days = 365 # Ensure minimum 1 year retention for all environments
  kms_key_id        = var.kms_key_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-convert-logs"
  })
}

resource "aws_cloudwatch_log_group" "compress" {
  name              = "/aws/lambda/${aws_lambda_function.compress.function_name}"
  retention_in_days = 365 # Ensure minimum 1 year retention for all environments
  kms_key_id        = var.kms_key_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-compress-logs"
  })
}

resource "aws_cloudwatch_log_group" "process" {
  name              = "/aws/lambda/${aws_lambda_function.process.function_name}"
  retention_in_days = 365 # Ensure minimum 1 year retention for all environments
  kms_key_id        = var.kms_key_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-process-logs"
  })
}

# Read the artifact after the build, including on a fresh checkout.
data "local_file" "convert_package" {
  filename   = local.convert_lambda_path
  depends_on = [null_resource.build_lambda_packages]
}

# Read the artifact after the build, including on a fresh checkout.
data "local_file" "compress_package" {
  filename   = local.compress_lambda_path
  depends_on = [null_resource.build_lambda_packages]
}

# Read the artifact after the build, including on a fresh checkout.
data "local_file" "process_package" {
  filename   = local.process_lambda_path
  depends_on = [null_resource.build_lambda_packages]
}
