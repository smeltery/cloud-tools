# Self-hosting

Run the web app, storage services, and processing worker as one installation.

## Local and production modes

LocalStack mode is selected by `NODE_ENV=development` or `test`. Production uses the AWS credential provider chain. Do not treat a successful frontend build as proof that the worker or cloud resources are deployed.

| Variable                                     | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `AWS_REGION`                                 | AWS region, defaults to `us-east-1`                              |
| `AWS_ENDPOINT_URL`                           | LocalStack endpoint in development; worker storage endpoint      |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | LocalStack test credentials; use workload identity in production |
| `S3_BUCKET_NAME`                             | Input/output bucket                                              |
| `DDB_TABLE_NAME`                             | Jobs table with `jobId` partition key                            |
| `SQS_QUEUE_NAME`                             | Queue name                                                       |
| `NEXT_PUBLIC_APP_URL`                        | Reachable application origin for worker status callbacks         |

The production queue URL is resolved from `SQS_QUEUE_NAME` through the AWS API. Grant the worker and app the required queue permissions. The worker's S3 download URL is endpoint-based, not presigned; configure a reachable endpoint and deliberate access policy.

## Build and run

```sh
flox activate
bun install --frozen-lockfile
bun run build
bun run start
```

Run the worker separately with production environment variables and Node/tsx. `bun run worker` is specifically the local-development command. Install FFmpeg and Calibre on any worker expected to handle their formats. Use a process supervisor for production.

## Infrastructure changes

Review `infrastructure/README.md` and the environment-specific Terraform settings. Run formatting and validation before a plan. Review the plan before applying resources; AWS resources incur costs. The repository's Lambda templates require packaging and runtime verification for native engines.

## Access and retention

The current API exposes job listing and mutation without authentication. Place it on a trusted network or add an authenticated gateway before public exposure. Add upload limits and rate limiting. Review bucket policy, encryption, object lifecycle, download authorization, and database TTL to match your use case. No universal retention promise is made by the UI.

## Verify the installation

Upload a small known file, queue conversion, observe a real worker completion, and open the output from the client network. Also test a corrupt file, unavailable engine, and denied storage access. Monitor worker errors and queue depth through AWS rather than the placeholder queue-count API.
