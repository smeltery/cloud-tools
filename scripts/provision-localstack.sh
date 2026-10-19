#!/usr/bin/env bash
set -euo pipefail
export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1
endpoint=http://localhost:4566
aws --endpoint-url="$endpoint" s3api head-bucket --bucket cloud-tools-local-bucket 2>/dev/null || aws --endpoint-url="$endpoint" s3api create-bucket --bucket cloud-tools-local-bucket
aws --endpoint-url="$endpoint" sqs create-queue --queue-name cloud-tools-jobs-queue
if ! aws --endpoint-url="$endpoint" dynamodb describe-table --table-name CloudToolsJobs >/dev/null 2>&1; then
  aws --endpoint-url="$endpoint" dynamodb create-table --table-name CloudToolsJobs --attribute-definitions AttributeName=jobId,AttributeType=S --key-schema AttributeName=jobId,KeyType=HASH --billing-mode PAY_PER_REQUEST
fi
