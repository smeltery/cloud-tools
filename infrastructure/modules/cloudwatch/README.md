# CloudWatch Module

This Terraform module creates comprehensive CloudWatch monitoring infrastructure for the Cloud Tools project. It sets up log groups, metric alarms, SNS notifications, and dashboards to provide full observability across Lambda functions, SQS queues, and DynamoDB tables.

## Features

- **Log Management**: Automated log groups for Lambda functions with configurable retention
- **Metric Alarms**: Error and duration monitoring for Lambda functions
- **Notification System**: SNS topic for alert distribution
- **Visual Dashboards**: Comprehensive monitoring dashboard for all resources
- **Multi-Service Monitoring**: Covers Lambda, SQS, and DynamoDB metrics
- **Configurable Thresholds**: Customizable alarm parameters

## Resources Created

### Logging Resources

- `aws_cloudwatch_log_group.lambda_logs` - Log groups for each Lambda function
- Configurable log retention policies

### Monitoring and Alerting

- `aws_cloudwatch_metric_alarm.lambda_errors` - Error rate alarms for Lambda functions
- `aws_cloudwatch_metric_alarm.lambda_duration` - Duration alarms for Lambda functions
- `aws_sns_topic.alerts` - SNS topic for alert notifications

### Visualization

- `aws_cloudwatch_dashboard.main` - Comprehensive monitoring dashboard with:
  - Lambda invocation metrics
  - SQS message flow metrics
  - DynamoDB capacity utilization metrics

## Usage

### Basic Usage

```hcl
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name      = "cloud-tools"
  environment      = "production"
  resource_suffix  = "abc123"

  # Lambda functions to monitor
  lambda_function_names = [
    "cloud-tools-convert-function",
    "cloud-tools-compress-function",
    "cloud-tools-process-function"
  ]

  # Resources to monitor
  sqs_queue_name      = "cloud-tools-job-queue"
  dynamodb_table_name = "cloud-tools-jobs"

  tags = {
    Environment = "production"
    Owner       = "platform-team"
    Project     = "cloud-tools"
  }
}
```

### Advanced Configuration

```hcl
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name      = "cloud-tools"
  environment      = "production"
  resource_suffix  = "abc123"

  # Lambda monitoring configuration
  lambda_function_names = [
    "cloud-tools-convert-function",
    "cloud-tools-compress-function",
    "cloud-tools-process-function"
  ]

  # Log retention and monitoring settings
  log_retention_in_days      = 30
  enable_detailed_monitoring = true

  # Resources to monitor
  sqs_queue_name      = "cloud-tools-job-queue"
  dynamodb_table_name = "cloud-tools-jobs"

  # Resource tagging
  tags = {
    Environment   = "production"
    Owner         = "platform-team"
    Project       = "cloud-tools"
    CostCenter    = "engineering"
    Backup        = "daily"
    MonitoringEnabled = "true"
  }
}
```

### Development Environment Setup

```hcl
module "cloudwatch_dev" {
  source = "./modules/cloudwatch"

  project_name      = "cloud-tools"
  environment      = "development"
  resource_suffix  = random_id.suffix.hex

  lambda_function_names = [
    module.lambda.convert_lambda_name,
    module.lambda.compress_lambda_name,
    module.lambda.process_lambda_name
  ]

  sqs_queue_name      = module.sqs.queue_name
  dynamodb_table_name = module.dynamodb.table_name

  # Development-specific settings
  log_retention_in_days      = 7   # Shorter retention for cost savings
  enable_detailed_monitoring = false

  tags = {
    Environment = "development"
    Project     = "cloud-tools"
    ManagedBy   = "terraform"
  }
}
```

## Variables

| Name                         | Description                                  | Type           | Default | Required |
| ---------------------------- | -------------------------------------------- | -------------- | ------- | :------: |
| `project_name`               | Name of the project                          | `string`       | n/a     |   yes    |
| `environment`                | Environment name                             | `string`       | n/a     |   yes    |
| `resource_suffix`            | Random suffix for resource naming            | `string`       | n/a     |   yes    |
| `lambda_function_names`      | List of Lambda function names for log groups | `list(string)` | `[]`    |    no    |
| `sqs_queue_name`             | SQS queue name for monitoring                | `string`       | n/a     |   yes    |
| `dynamodb_table_name`        | DynamoDB table name for monitoring           | `string`       | n/a     |   yes    |
| `log_retention_in_days`      | CloudWatch logs retention period in days     | `number`       | `14`    |    no    |
| `enable_detailed_monitoring` | Enable detailed CloudWatch monitoring        | `bool`         | `false` |    no    |
| `tags`                       | Tags to apply to resources                   | `map(string)`  | `{}`    |    no    |

## Outputs

| Name               | Description                   |
| ------------------ | ----------------------------- |
| `log_groups`       | CloudWatch log groups created |
| `dashboard_url`    | CloudWatch dashboard URL      |
| `alerts_topic_arn` | SNS topic ARN for alerts      |

## Monitoring Features

### Lambda Function Monitoring

### Error Rate Alarms

- Monitors Lambda function errors
- Threshold: 5 errors within 2 evaluation periods (2 minutes)
- Sends alerts to SNS topic when triggered

### Duration Alarms

- Monitors Lambda execution time
- Threshold: 30 seconds average duration
- Helps identify performance issues

### Log Groups

- Automatic log group creation for each Lambda function
- Configurable retention periods (default: 14 days)
- Standardized naming: `/aws/lambda/{function-name}`

### SQS Queue Monitoring

Dashboard metrics include:

- **NumberOfMessagesSent**: Messages added to queue
- **NumberOfMessagesReceived**: Messages processed from queue
- Time-series visualization with 5-minute periods

### DynamoDB Table Monitoring

Dashboard metrics include:

- **ConsumedReadCapacityUnits**: Read capacity utilization
- **ConsumedWriteCapacityUnits**: Write capacity utilization
- Helps monitor capacity planning and costs

### CloudWatch Dashboard

The module creates a comprehensive dashboard with three main sections:

1. **Lambda Invocations** (Top panel)
   - Displays invocation counts for all monitored Lambda functions
   - Time-series chart with 5-minute periods
   - Helps track usage patterns and load

2. **SQS Messages** (Middle panel)
   - Shows message flow through the queue
   - Tracks both sent and received message counts
   - Essential for monitoring queue health

3. **DynamoDB Capacity** (Bottom panel)
   - Displays read and write capacity consumption
   - Helps optimize capacity settings and costs
   - Critical for preventing throttling

## Alerting Configuration

### SNS Topic Setup

The module creates an SNS topic for alert notifications:

- **Topic Name**: `{project_name}-{environment}-alerts-{resource_suffix}`
- **Usage**: Connected to all CloudWatch alarms
- **Integration**: Ready for email, SMS, or webhook subscriptions

### Alarm Thresholds

Current alarm configurations:

| Metric          | Threshold        | Evaluation Period | Action    |
| --------------- | ---------------- | ----------------- | --------- |
| Lambda Errors   | > 5 errors       | 2 minutes         | SNS Alert |
| Lambda Duration | > 30 seconds avg | 2 minutes         | SNS Alert |

### Customizing Thresholds

To modify alarm thresholds, update the module configuration:

```hcl
# Custom alarm thresholds would require module variables
# This is a future enhancement opportunity
```

## Cost Optimization

- **Log Retention**: Configurable retention periods help control CloudWatch Logs costs
- **Monitoring Granularity**: 5-minute periods balance cost and observability
- **Resource Tagging**: Comprehensive tagging enables cost allocation and tracking

## Security Considerations

1. **SNS Topic**: Topic ARN is provided as output for secure subscription management
2. **Log Access**: Log groups inherit IAM permissions from Lambda execution roles
3. **Dashboard Access**: Dashboard visibility controlled by CloudWatch IAM permissions

## Integration Examples

### Email Alert Setup

```hcl
# After creating the CloudWatch module, subscribe to alerts
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = module.cloudwatch.alerts_topic_arn
  protocol  = "email"
  endpoint  = "alerts@company.com"
}
```

### Slack Integration

```hcl
# Webhook subscription for Slack notifications
resource "aws_sns_topic_subscription" "slack_alerts" {
  topic_arn = module.cloudwatch.alerts_topic_arn
  protocol  = "https"
  endpoint  = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
}
```

### Lambda Alert Handler

```hcl
# Lambda function to process alerts
resource "aws_sns_topic_subscription" "lambda_alerts" {
  topic_arn = module.cloudwatch.alerts_topic_arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alert_handler.arn
}

resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_handler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.cloudwatch.alerts_topic_arn
}
```

## Migration and Updates

When updating this module:

1. **Log Groups**: Existing log groups are preserved during updates
2. **Alarms**: Threshold changes take effect immediately
3. **Dashboard**: Layout changes require dashboard recreation
4. **SNS Subscriptions**: Manual subscriptions are preserved

## Troubleshooting

### Common Issues

### Log Groups Not Created

- Verify Lambda function names are correct
- Check IAM permissions for CloudWatch Logs

### Alarms Not Triggering

- Verify Lambda functions are generating metrics
- Check alarm threshold settings
- Ensure SNS topic has valid subscriptions

### Dashboard Not Loading

- Verify resource names match actual AWS resources
- Check CloudWatch dashboard permissions
- Ensure region consistency

### Debug Commands

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"

# Check alarm state
aws cloudwatch describe-alarms --alarm-names "project-env-function-errors"

# Test SNS topic
aws sns publish --topic-arn "arn:aws:sns:region:account:topic-name" --message "Test message"
```

## Best Practices

1. **Naming Consistency**: Use consistent naming patterns for easy identification
2. **Retention Policies**: Set appropriate log retention based on compliance needs
3. **Alert Management**: Subscribe relevant teams to SNS topics
4. **Dashboard Organization**: Group related metrics for better visibility
5. **Cost Monitoring**: Regularly review CloudWatch costs and optimize retention
6. **Threshold Tuning**: Adjust alarm thresholds based on application behavior

## Future Enhancements

Potential improvements to this module:

1. **Custom Metrics**: Support for application-specific metrics
2. **Configurable Thresholds**: Variables for alarm threshold customization
3. **Additional Services**: Monitoring for API Gateway, S3, and other services
4. **Automated Responses**: Lambda-based auto-remediation actions
5. **Multi-Region Support**: Cross-region monitoring capabilities
