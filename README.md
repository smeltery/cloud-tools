# <img src="client/public/logo.svg" width="40" height="40" alt=""> Cloud Tools

Convert images, audio, video, and eBooks. Compress images and PDFs. A practical, self-hostable file toolbox from Smeltery.

[![CI](https://github.com/smeltery/cloud-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/smeltery/cloud-tools/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/smeltery/cloud-tools)](https://github.com/smeltery/cloud-tools/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-1.3.11-f9f1e1?logo=bun&logoColor=black)](https://bun.sh)
[![Flox](https://img.shields.io/badge/dev_environment-Flox-7b61ff)](https://flox.dev)
[![Terraform](https://img.shields.io/badge/Terraform-844fba?logo=terraform&logoColor=white)](https://www.terraform.io)
[![License](https://img.shields.io/badge/license-PolyForm_Shield-blue)](LICENSE)

![Cloud Tools — a new format, a lighter file](client/public/og.png)

A Next.js interface submits jobs to SQS. A TypeScript worker processes files with Sharp, FFmpeg, Calibre, and pdf-lib; S3 stores files and DynamoDB tracks jobs. Terraform defines the infrastructure, and LocalStack supports local development.

## Start

```sh
flox activate
bun install --frozen-lockfile
bun run dev
```

The interface opens at `http://localhost:3000`. Real conversions also need the backend and worker: follow the [quick start](docs/quick-start.md).

## Documentation

Start in [docs/](docs/README.md): [using the tools](docs/conversion.md), [formats](docs/formats.md), [API](docs/api.md), [architecture](docs/architecture.md), [self-hosting](docs/deployment.md), and [contributing](docs/development.md). The same guides are served at `/docs`.

Run `bun run hooks:install` to enable the local CI checks. See [development](docs/development.md) for validation, LOC budgets, and automatic releases.

Licensed under [PolyForm Shield 1.0.0](LICENSE).
