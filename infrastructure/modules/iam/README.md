# IAM Module

This Terraform module creates and manages IAM roles and policies for the Cloud Tools project. It provides secure, least-privilege access for Lambda functions, API Gateway logging, and integrations with AWS services including S3, DynamoDB, and SQS.

## Features

- **Lambda Execution Roles**: Comprehensive IAM roles for Lambda function execution
- **Service Integrations**: Secure access policies for S3, DynamoDB, and SQS
- **API Gateway Logging**: Dedicated role for CloudWatch logging from API Gateway
- **Enhanced Monitoring**: CloudWatch Insights and X-Ray tracing permissions
- **Environment-Specific**: Production-optimized VPC access policies
- **Principle of Least Privilege**: Scoped permissions to specific resources

## Resources Created

### Core IAM Roles

- `aws_iam_role.lambda_execution` - Primary Lambda execution role
- `aws_iam_role.api_gateway_cloudwatch` - API Gateway CloudWatch logging role

### Lambda Policies and Attachments

- `aws_iam_role_policy_attachment.lambda_basic` - Basic Lambda execution policy
- `aws_iam_role_policy_attachment.lambda_vpc` - VPC access (production only)
- `aws_iam_role_policy.lambda_s3` - S3 bucket access policy
- `aws_iam_role_policy.lambda_dynamodb` - DynamoDB table and index access
- `aws_iam_role_policy.lambda_sqs` - SQS queue operations policy

### Monitoring and Observability

- `aws_iam_role_policy.lambda_cloudwatch_insights` - CloudWatch Insights and X-Ray
- `aws_iam_role_policy_attachment.api_gateway_cloudwatch` - API Gateway logging policy

## Usage

### Basic Usage

```hcl
module "iam" {
  source = "./modules/iam"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "abc123"

  # Resource references for scoped permissions
  s3_bucket_name      = module.s3.bucket_name
  dynamodb_table_name = module.dynamodb.table_name
  sqs_queue_arn      = module.sqs.queue_arn

  tags = {
    Environment = "production"
    Owner       = "platform-team"
    Project     = "cloud-tools"
  }
}
```

### Advanced Configuration

```hcl
module "iam" {
  source = "./modules/iam"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "abc123"

  # Service integrations
  s3_bucket_name      = module.s3.bucket_name
  dynamodb_table_name = module.dynamodb.table_name
  sqs_queue_arn      = module.sqs.queue_arn

  # Comprehensive tagging
  tags = {
    Environment     = "production"
    Owner          = "platform-team"
    Project        = "cloud-tools"
    CostCenter     = "engineering"
    SecurityScope  = "service-roles"
    Compliance     = "required"
    ManagedBy      = "terraform"
  }
}
```

### Development Environment

```hcl
module "iam_dev" {
  source = "./modules/iam"

  project_name    = "cloud-tools"
  environment     = "development"
  resource_suffix = random_id.suffix.hex

  s3_bucket_name      = module.s3_dev.bucket_name
  dynamodb_table_name = module.dynamodb_dev.table_name
  sqs_queue_arn      = module.sqs_dev.queue_arn

  # Development-specific tagging
  tags = {
    Environment = "development"
    Project     = "cloud-tools"
    Owner       = "dev-team"
    ManagedBy   = "terraform"
  }
}
```

## Variables

| Name                  | Description                                | Type          | Default | Required |
| --------------------- | ------------------------------------------ | ------------- | ------- | :------: |
| `project_name`        | Name of the project                        | `string`      | n/a     |   yes    |
| `environment`         | Environment name                           | `string`      | n/a     |   yes    |
| `resource_suffix`     | Random suffix for resource naming          | `string`      | n/a     |   yes    |
| `s3_bucket_name`      | Name of the S3 bucket for permissions      | `string`      | n/a     |   yes    |
| `dynamodb_table_name` | Name of the DynamoDB table for permissions | `string`      | n/a     |   yes    |
| `sqs_queue_arn`       | ARN of the SQS queue for permissions       | `string`      | n/a     |   yes    |
| `tags`                | Tags to apply to resources                 | `map(string)` | `{}`    |    no    |

## Outputs

| Name                               | Description                             |
| ---------------------------------- | --------------------------------------- |
| `lambda_execution_role_name`       | Name of the Lambda execution role       |
| `lambda_execution_role_arn`        | ARN of the Lambda execution role        |
| `api_gateway_cloudwatch_role_name` | Name of the API Gateway CloudWatch role |
| `api_gateway_cloudwatch_role_arn`  | ARN of the API Gateway CloudWatch role  |

## IAM Roles and Policies

### Lambda Execution Role

**Role Name**: `{project_name}-lambda-execution-{environment}-{resource_suffix}`

**Trust Policy**: Allows Lambda service to assume the role

**Attached Policies**:

1. **AWSLambdaBasicExecutionRole** (AWS Managed)
   - CloudWatch Logs permissions
   - Basic Lambda execution rights

2. **AWSLambdaVPCAccessExecutionRole** (AWS Managed - Production Only)
   - VPC network interface management
   - ENI creation and management for VPC Lambda functions

### Custom Inline Policies

#### S3 Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetObjectVersion"
      ],
      "Resource": ["arn:aws:s3:::bucket-name", "arn:aws:s3:::bucket-name/*"]
    }
  ]
}
```

**Permissions Scope**:

- Read, write, and delete objects in the specified S3 bucket
- List bucket contents
- Access object versions for versioned buckets

#### DynamoDB Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:region:account:table/table-name",
        "arn:aws:dynamodb:region:account:table/table-name/index/*"
      ]
    }
  ]
}
```

**Permissions Scope**:

- Full CRUD operations on the specified DynamoDB table
- Query and scan operations
- Batch operations for efficiency
- Access to all Global Secondary Indexes

#### SQS Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility",
        "sqs:GetQueueUrl"
      ],
      "Resource": ["queue-arn", "queue-arn-dlq"]
    }
  ]
}
```

**Permissions Scope**:

- Send messages to the queue
- Receive and process messages
- Manage message visibility timeout
- Access both main queue and dead letter queue

#### CloudWatch Insights and X-Ray Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateInsightRule",
        "logs:DeleteInsightRule",
        "logs:DescribeInsightRules",
        "logs:StartQuery",
        "logs:StopQuery",
        "logs:GetQueryResults"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
      "Resource": "*"
    }
  ]
}
```

**Permissions Scope**:

- CloudWatch Insights query management
- X-Ray tracing data submission
- Enhanced observability and debugging capabilities

### API Gateway CloudWatch Role

**Role Name**: `{project_name}-api-gateway-cloudwatch-{environment}-{resource_suffix}`

**Trust Policy**: Allows API Gateway service to assume the role

**Attached Policy**:

- **AmazonAPIGatewayPushToCloudWatchLogs** (AWS Managed)
  - Push API Gateway access logs to CloudWatch
  - Create and manage log groups and streams

## Security Best Practices

### Principle of Least Privilege

- Policies are scoped to specific resources using ARNs
- No wildcard permissions except where necessary for service functionality
- Separate roles for different service functions

### Resource-Specific Permissions

```hcl
# S3 permissions are scoped to a specific bucket
"Resource": [
  "arn:aws:s3:::${var.s3_bucket_name}",
  "arn:aws:s3:::${var.s3_bucket_name}/*"
]

# DynamoDB permissions include table and all indexes
"Resource": [
  "arn:aws:dynamodb:region:account:table/${var.dynamodb_table_name}",
  "arn:aws:dynamodb:region:account:table/${var.dynamodb_table_name}/index/*"
]
```

### Environment-Specific Controls

- VPC access only enabled for production environment
- Resource suffixes ensure environment isolation
- Tags enable proper resource tracking and access control

## Integration Examples

### Lambda Function Integration

```hcl
module "lambda" {
  source = "./modules/lambda"

  # Use IAM role from this module
  lambda_execution_role_arn = module.iam.lambda_execution_role_arn

  # Other Lambda configuration...
}
```

### API Gateway Integration

```hcl
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = module.iam.api_gateway_cloudwatch_role_arn
}
```

### Cross-Service Permission Verification

```python
import boto3
import os

def verify_permissions():
    """Verify Lambda has required permissions"""
    s3 = boto3.client('s3')
    dynamodb = boto3.client('dynamodb')
    sqs = boto3.client('sqs')

    bucket_name = os.environ['S3_BUCKET_NAME']
    table_name = os.environ['DYNAMODB_TABLE_NAME']
    queue_url = os.environ['SQS_QUEUE_URL']

    try:
        # Test S3 access
        s3.head_bucket(Bucket=bucket_name)

        # Test DynamoDB access
        dynamodb.describe_table(TableName=table_name)

        # Test SQS access
        sqs.get_queue_attributes(QueueUrl=queue_url)

        return {"status": "success", "message": "All permissions verified"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
```

## Cost Optimization

### IAM Role Management

- Single execution role for all Lambda functions reduces complexity
- Scoped permissions reduce risk and potential cross-service charges
- No unnecessary policy attachments

### Monitoring Cost Impact

- CloudWatch Insights permissions enable cost monitoring
- X-Ray tracing helps identify expensive operations
- Resource-specific permissions prevent accidental high-cost operations

## Troubleshooting

### Common Permission Issues

### S3 Access Denied

```bash
# Check S3 bucket policy and IAM policy alignment
aws s3api get-bucket-policy --bucket bucket-name
aws iam get-role-policy --role-name role-name --policy-name policy-name
```

### DynamoDB Permission Errors

```bash
# Verify table and index permissions
aws dynamodb describe-table --table-name table-name
aws iam simulate-principal-policy --policy-source-arn role-arn --action-names dynamodb:GetItem
```

### SQS Permission Issues

```bash
# Check queue permissions and policy
aws sqs get-queue-attributes --queue-url queue-url --attribute-names All
```

### Debug Commands

```bash
# List all policies attached to the Lambda role
aws iam list-attached-role-policies --role-name lambda-role-name
aws iam list-role-policies --role-name lambda-role-name

# Test specific permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:role/role-name \
  --action-names s3:GetObject,dynamodb:PutItem,sqs:SendMessage \
  --resource-arns resource-arn
```

### Permission Testing

```python
import boto3
from botocore.exceptions import ClientError

def test_iam_permissions():
    """Test all IAM permissions are working"""
    tests = []

    # Test S3 permissions
    try:
        s3 = boto3.client('s3')
        s3.list_objects_v2(Bucket=os.environ['S3_BUCKET_NAME'], MaxKeys=1)
        tests.append({"service": "S3", "status": "PASS"})
    except ClientError as e:
        tests.append({"service": "S3", "status": "FAIL", "error": str(e)})

    # Test DynamoDB permissions
    try:
        dynamodb = boto3.client('dynamodb')
        dynamodb.scan(TableName=os.environ['DYNAMODB_TABLE_NAME'], Limit=1)
        tests.append({"service": "DynamoDB", "status": "PASS"})
    except ClientError as e:
        tests.append({"service": "DynamoDB", "status": "FAIL", "error": str(e)})

    # Test SQS permissions
    try:
        sqs = boto3.client('sqs')
        sqs.get_queue_attributes(QueueUrl=os.environ['SQS_QUEUE_URL'])
        tests.append({"service": "SQS", "status": "PASS"})
    except ClientError as e:
        tests.append({"service": "SQS", "status": "FAIL", "error": str(e)})

    return tests
```

## Migration and Updates

### Role Updates

- Policy changes are applied immediately
- No downtime for policy updates
- Role name changes require Lambda function updates

### Policy Evolution

```hcl
# Adding new service permissions
resource "aws_iam_role_policy" "lambda_new_service" {
  name = "${var.project_name}-lambda-new-service-${var.environment}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["service:Action"]
        Resource = "arn:aws:service:region:account:resource/*"
      }
    ]
  })
}
```

## Compliance and Governance

### Policy Documentation

- All permissions are explicitly defined
- Resource ARNs prevent privilege escalation
- Regular policy reviews through Terraform plans

### Access Patterns

```json
{
  "lambda_functions": {
    "s3_access": ["GetObject", "PutObject", "DeleteObject"],
    "dynamodb_access": ["GetItem", "PutItem", "UpdateItem", "Query"],
    "sqs_access": ["SendMessage", "ReceiveMessage", "DeleteMessage"]
  },
  "api_gateway": {
    "cloudwatch_access": ["CreateLogGroup", "CreateLogStream", "PutLogEvents"]
  }
}
```

### Audit Trail

- All IAM changes tracked through Terraform state
- CloudTrail logs all API calls using these roles
- Policy simulator available for testing changes

## Future Enhancements

Potential improvements to this module:

1. **Conditional Policies**: Variables to enable/disable specific service permissions
2. **Cross-Account Access**: Support for cross-account role assumptions
3. **Policy Templates**: Reusable policy templates for different Lambda function types
4. **Automated Testing**: Integration with policy validation tools
5. **Secrets Manager**: Permissions for secure secrets access
6. **EventBridge Integration**: Permissions for event-driven architectures

## Examples

### Multi-Environment Deployment

```hcl
# Development environment
module "iam_dev" {
  source = "./modules/iam"

  project_name    = "cloud-tools"
  environment     = "development"
  resource_suffix = "dev"

  s3_bucket_name      = "cloud-tools-dev-bucket"
  dynamodb_table_name = "cloud-tools-jobs-dev"
  sqs_queue_arn      = "arn:aws:sqs:region:account:cloud-tools-dev-queue"
}

# Production environment
module "iam_prod" {
  source = "./modules/iam"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "prod"

  s3_bucket_name      = "cloud-tools-prod-bucket"
  dynamodb_table_name = "cloud-tools-jobs-prod"
  sqs_queue_arn      = "arn:aws:sqs:region:account:cloud-tools-prod-queue"
}
```

### Custom Policy Addition

```hcl
# Extend the module with additional policies
resource "aws_iam_role_policy" "lambda_custom" {
  name = "custom-policy"
  role = module.iam.lambda_execution_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:region:account:secret:app-secrets-*"
      }
    ]
  })
}
```
