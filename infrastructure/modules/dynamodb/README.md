# DynamoDB Module

This Terraform module creates a DynamoDB table optimized for job tracking in the Cloud Tools project. It includes Global Secondary Indexes (GSI) for efficient querying, automatic TTL cleanup, backup strategies, and monitoring capabilities.

## Features

- **Job Tracking Table**: Optimized for storing and querying job information
- **Global Secondary Indexes**: Efficient querying by status, user, and creation time
- **Automatic Cleanup**: TTL-based automatic item expiration
- **Data Protection**: Point-in-time recovery and backup strategies
- **Monitoring**: CloudWatch Contributor Insights for performance analysis
- **Flexible Billing**: Support for both pay-per-request and provisioned capacity
- **System Monitoring**: Initial system status entry for health checks

## Resources Created

### Core Table

- `aws_dynamodb_table.main` - Primary DynamoDB table with GSI configuration
- `aws_dynamodb_table_point_in_time_recovery.main` - Point-in-time recovery enablement

### Backup and Recovery

- `aws_dynamodb_backup.main` - Daily backup for production environments
- Point-in-time recovery for data protection

### Monitoring and Management

- `aws_dynamodb_contributor_insights.main` - Performance insights
- `aws_dynamodb_table_item.system_status` - System health monitoring entry

### Indexing Strategy

- **Primary Key**: `jobId` (String) - Unique job identifier
- **StatusIndex GSI**: Query jobs by status and creation time
- **UserIndex GSI**: Query jobs by user and creation time (future use)

## Usage

### Basic Usage

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "abc123"

  tags = {
    Environment = "production"
    Owner       = "platform-team"
    Project     = "cloud-tools"
  }
}
```

### Advanced Configuration

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "abc123"

  # Table configuration
  table_name    = "CustomJobsTable"
  billing_mode  = "PROVISIONED"  # or "PAY_PER_REQUEST"

  # Data protection
  enable_point_in_time_recovery = true

  # Resource tagging
  tags = {
    Environment   = "production"
    Owner         = "platform-team"
    Project       = "cloud-tools"
    CostCenter    = "engineering"
    Backup        = "daily"
    DataClass     = "operational"
  }
}
```

### Development Environment

```hcl
module "dynamodb_dev" {
  source = "./modules/dynamodb"

  project_name    = "cloud-tools"
  environment     = "development"
  resource_suffix = random_id.suffix.hex

  # Cost-optimized settings for development
  billing_mode = "PAY_PER_REQUEST"
  enable_point_in_time_recovery = false

  tags = {
    Environment = "development"
    Project     = "cloud-tools"
    ManagedBy   = "terraform"
  }
}
```

## Variables

| Name                            | Description                                      | Type          | Default             | Required |
| ------------------------------- | ------------------------------------------------ | ------------- | ------------------- | :------: |
| `project_name`                  | Name of the project                              | `string`      | n/a                 |   yes    |
| `environment`                   | Environment name                                 | `string`      | n/a                 |   yes    |
| `resource_suffix`               | Random suffix for resource naming                | `string`      | n/a                 |   yes    |
| `table_name`                    | Name of the DynamoDB table                       | `string`      | `"CloudToolsJobs"`  |    no    |
| `billing_mode`                  | Billing mode for DynamoDB table                  | `string`      | `"PAY_PER_REQUEST"` |    no    |
| `enable_point_in_time_recovery` | Enable point-in-time recovery for DynamoDB table | `bool`        | `true`              |    no    |
| `tags`                          | Tags to apply to resources                       | `map(string)` | `{}`                |    no    |

## Outputs

| Name                       | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `table_name`               | Name of the DynamoDB table                     |
| `table_id`                 | ID of the DynamoDB table                       |
| `table_arn`                | ARN of the DynamoDB table                      |
| `table_stream_arn`         | ARN of the DynamoDB table stream               |
| `global_secondary_indexes` | Global secondary indexes of the DynamoDB table |

## Table Schema

### Primary Key Structure

```json
{
  "jobId": "string" // Partition key - Unique job identifier
}
```

### Item Attributes

| Attribute    | Type   | Description                                         | Required |
| ------------ | ------ | --------------------------------------------------- | -------- |
| `jobId`      | String | Unique job identifier (Primary Key)                 | Yes      |
| `status`     | String | Job status (pending, processing, completed, failed) | Yes      |
| `userId`     | String | User identifier (for future multi-user support)     | Yes      |
| `createdAt`  | String | ISO timestamp of job creation                       | Yes      |
| `updatedAt`  | String | ISO timestamp of last update                        | No       |
| `jobType`    | String | Type of job (convert, compress, etc.)               | No       |
| `inputFile`  | String | Original file information                           | No       |
| `outputFile` | String | Processed file information                          | No       |
| `metadata`   | Map    | Additional job metadata                             | No       |
| `ttl`        | Number | TTL for automatic cleanup (Unix timestamp)          | No       |

### Global Secondary Indexes

#### StatusIndex

- **Partition Key**: `status`
- **Sort Key**: `createdAt`
- **Projection**: ALL
- **Use Case**: Query jobs by status, ordered by creation time

```hcl
# Example query pattern
filter_expression = "status = :status"
expression_attribute_values = {
  ":status" = "processing"
}
```

#### UserIndex (Future Use)

- **Partition Key**: `userId`
- **Sort Key**: `createdAt`
- **Projection**: ALL
- **Use Case**: Query jobs for specific user, ordered by creation time

```hcl
# Example query pattern
filter_expression = "userId = :userId"
expression_attribute_values = {
  ":userId" = "user123"
}
```

## Data Management

### TTL (Time To Live)

The table includes TTL configuration for automatic cleanup:

- **Attribute**: `ttl`
- **Format**: Unix timestamp
- **Purpose**: Automatic deletion of expired job records
- **Default**: System entries have 1-year TTL

### Backup Strategy

### Point-in-Time Recovery

- Continuous backups up to 35 days
- Enables restore to any second within the backup window
- Essential for production data protection

### Daily Backups

- Automated daily backups for production environments
- Backup naming: `{table-name}-backup-YYYY-MM-DD`
- Retention managed by AWS DynamoDB backup policies

## Query Patterns

### Primary Key Queries

```python
# Get specific job by ID
response = dynamodb.get_item(
    TableName='table-name',
    Key={'jobId': {'S': 'job-12345'}}
)
```

### GSI Queries

```python
# Query jobs by status
response = dynamodb.query(
    TableName='table-name',
    IndexName='StatusIndex',
    KeyConditionExpression='status = :status',
    ExpressionAttributeValues={':status': {'S': 'processing'}}
)

# Query jobs by user (future use)
response = dynamodb.query(
    TableName='table-name',
    IndexName='UserIndex',
    KeyConditionExpression='userId = :userId',
    ExpressionAttributeValues={':userId': {'S': 'user123'}}
)
```

### Scan Operations

```python
# Scan for jobs within date range
response = dynamodb.scan(
    TableName='table-name',
    FilterExpression='createdAt BETWEEN :start AND :end',
    ExpressionAttributeValues={
        ':start': {'S': '2024-01-01T00:00:00Z'},
        ':end': {'S': '2024-01-31T23:59:59Z'}
    }
)
```

## Billing Modes

### PAY_PER_REQUEST (Default)

- **Best for**: Variable, unpredictable traffic
- **Pricing**: Per read/write request
- **Scaling**: Automatic, no capacity management
- **Use Cases**: Development, small applications, unpredictable workloads

```hcl
module "dynamodb" {
  # ... other configuration
  billing_mode = "PAY_PER_REQUEST"
}
```

### PROVISIONED

- **Best for**: Predictable traffic patterns
- **Pricing**: Per provisioned capacity unit
- **Scaling**: Manual or auto-scaling configuration required
- **Use Cases**: Production with predictable load

```hcl
module "dynamodb" {
  # ... other configuration
  billing_mode = "PROVISIONED"

  # Note: Provisioned capacity configuration would require
  # additional variables (future enhancement)
}
```

## Monitoring and Observability

### CloudWatch Metrics

Automatically available metrics:

- **ConsumedReadCapacityUnits**: Read capacity consumption
- **ConsumedWriteCapacityUnits**: Write capacity consumption
- **SuccessfulRequestLatency**: Request latency
- **ThrottledRequests**: Throttling incidents

### Contributor Insights

Enabled for performance analysis:

- Top contributors by consumed capacity
- Most accessed items
- Request patterns analysis

### Integration with CloudWatch Module

```hcl
module "cloudwatch" {
  # ... other configuration
  dynamodb_table_name = module.dynamodb.table_name
}
```

## Security Considerations

### IAM Permissions

Required Lambda function permissions:

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
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:region:account:table/table-name",
        "arn:aws:dynamodb:region:account:table/table-name/index/*"
      ]
    }
  ]
}
```

### Encryption

- **At Rest**: Enabled by default with AWS managed keys
- **In Transit**: SSL/TLS for all API calls
- **Enhanced**: Customer managed keys can be configured

## Cost Optimization

### Strategies

1. **TTL Usage**: Automatic cleanup prevents storage growth
2. **Billing Mode**: Choose appropriate mode based on usage patterns
3. **GSI Design**: Careful projection type selection
4. **Backup Management**: Balance protection needs with costs

### Cost Estimation

```hcl
# Development environment - minimal cost
billing_mode = "PAY_PER_REQUEST"
enable_point_in_time_recovery = false

# Production environment - optimized for reliability
billing_mode = "PROVISIONED"  # If traffic is predictable
enable_point_in_time_recovery = true
```

## Migration and Updates

### Schema Evolution

- **Adding Attributes**: No downtime, backward compatible
- **GSI Changes**: May require recreation or additional GSIs
- **TTL Changes**: Can be updated without downtime

### Data Migration

```bash
# Export data for migration
aws dynamodb scan --table-name source-table --output json > backup.json

# Import to new table
aws dynamodb batch-write-item --request-items file://backup.json
```

## Troubleshooting

### Common Issues

### Throttling Errors

- Check capacity settings for provisioned mode
- Monitor hot keys and distribute access patterns
- Consider GSI design optimization

### TTL Not Working

- Verify TTL attribute format (Unix timestamp)
- Check TTL enablement status
- Allow up to 48 hours for TTL processing

### Query Performance Issues

- Analyze query patterns with Contributor Insights
- Review GSI design and projections
- Consider query optimization strategies

### Debug Commands

```bash
# Check table status
aws dynamodb describe-table --table-name table-name

# Verify TTL configuration
aws dynamodb describe-time-to-live --table-name table-name

# Check backup status
aws dynamodb list-backups --table-name table-name
```

## Best Practices

### Design Patterns

1. **Single Table Design**: Consider consolidating related entities
2. **Hot Key Avoidance**: Distribute partition keys evenly
3. **GSI Optimization**: Use sparse indexes and appropriate projections
4. **TTL Strategy**: Implement consistent cleanup policies

### Development Workflow

1. **Environment Separation**: Use different tables for dev/staging/prod
2. **Testing Strategy**: Use local DynamoDB for unit tests
3. **Monitoring**: Implement comprehensive CloudWatch dashboards
4. **Backup Testing**: Regularly test restore procedures

### Performance Optimization

1. **Batch Operations**: Use batch read/write for efficiency
2. **Connection Pooling**: Reuse connections in Lambda functions
3. **Caching**: Implement caching layers for frequently accessed data
4. **Query Patterns**: Design GSIs based on access patterns

## Examples

### Lambda Integration

```python
import boto3
import json
from datetime import datetime, timedelta

dynamodb = boto3.client('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']

def create_job(job_id, job_type, user_id):
    """Create a new job entry"""
    ttl = int((datetime.now() + timedelta(days=30)).timestamp())

    item = {
        'jobId': {'S': job_id},
        'status': {'S': 'pending'},
        'userId': {'S': user_id},
        'createdAt': {'S': datetime.utcnow().isoformat()},
        'jobType': {'S': job_type},
        'ttl': {'N': str(ttl)}
    }

    return dynamodb.put_item(
        TableName=table_name,
        Item=item
    )

def update_job_status(job_id, status, output_file=None):
    """Update job status"""
    update_expression = "SET #status = :status, updatedAt = :updated"
    expression_values = {
        ':status': {'S': status},
        ':updated': {'S': datetime.utcnow().isoformat()}
    }

    if output_file:
        update_expression += ", outputFile = :output"
        expression_values[':output'] = {'S': output_file}

    return dynamodb.update_item(
        TableName=table_name,
        Key={'jobId': {'S': job_id}},
        UpdateExpression=update_expression,
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues=expression_values
    )
```

### Multi-Environment Setup

```hcl
# Development
module "dynamodb_dev" {
  source = "./modules/dynamodb"

  project_name    = "cloud-tools"
  environment     = "development"
  resource_suffix = "dev"
  billing_mode    = "PAY_PER_REQUEST"
  enable_point_in_time_recovery = false
}

# Production
module "dynamodb_prod" {
  source = "./modules/dynamodb"

  project_name    = "cloud-tools"
  environment     = "production"
  resource_suffix = "prod"
  billing_mode    = "PAY_PER_REQUEST"  # or PROVISIONED based on usage
  enable_point_in_time_recovery = true
}
```
