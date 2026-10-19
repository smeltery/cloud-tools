# Architecture

A browser interface over an asynchronous file-processing pipeline.

## Components

```mermaid
flowchart TB
    Browser[Next.js browser interface] --> API[Next.js API routes]
    API --> S3[(S3 originals)]
    API --> DB[(DynamoDB jobs)]
    API --> SQS[SQS processing queue]
    SQS --> Worker[TypeScript worker]
    S3 --> Worker
    Worker --> Engines[Sharp / FFmpeg / Calibre / pdf-lib]
    Engines --> Output[(S3 outputs)]
    Worker --> API
    API --> Browser
```

`client/` owns pages, components, API routes, and tests. `lib/aws-config.ts` supplies shared clients and resource names. `lib/worker.ts` polls SQS and delegates to file processors. `scripts/worker.ts` loads configuration and starts the worker.

## Infrastructure

`infrastructure/` contains Terraform modules for storage, queues, IAM, monitoring, the API gateway, and Lambda scaffolding. Local development uses LocalStack. The standalone worker and Lambda scaffolding are distinct execution paths; validate engine packaging and permissions before choosing a deployment.

## Documentation

The website renders the curated Markdown files in `docs/` at build time. A shared catalog supplies sidebar and search entries. Mermaid diagrams render lazily in the browser and are syntax-checked in CI. Navigation, footer, and branding are shared components.

## Development and releases

```mermaid
flowchart LR
    Edit[Change code or docs] --> Hooks[Local checks]
    Hooks --> CI[Pull request CI]
    CI --> Merge[Merge to master]
    Merge --> Green[Successful CI]
    Green --> Tag[Patch tag]
    Tag --> Release[GitHub release]
```

Bun installs the workspace; Node runs Next.js and Vitest. Flox locks system tools for local work and CI. A release is cut only for the exact successful default-branch revision. See [contributing](development.md).
