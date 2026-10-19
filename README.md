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

## Use the tools

1. Choose an image, audio, video, or eBook converter—or image/PDF compression.
2. Upload a file and choose its output format, or start compression.
3. Follow the job’s progress and download the finished file. Keep your original until you’ve checked the result.

Files are processed by the installation’s worker, not entirely in your browser. See [formats](docs/formats.md), [jobs and downloads](docs/jobs.md), and [file handling](docs/conversion.md).

## Run locally

Install [Flox](https://flox.dev/docs/install-flox/), then:

```sh
git clone https://github.com/smeltery/cloud-tools.git
cd cloud-tools
flox activate
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000` to preview the interface. **For working uploads and conversions**, follow the [quick start](docs/quick-start.md) to start Docker/LocalStack, provision storage and queues, and run the worker. See [self-hosting](docs/deployment.md) for AWS deployment.

## Documentation

Start in [docs/](docs/README.md): [using the tools](docs/conversion.md), [formats](docs/formats.md), [API](docs/api.md), [architecture](docs/architecture.md), [self-hosting](docs/deployment.md), and [contributing](docs/development.md). The same guides are served at `/docs`.

Run `bun run hooks:install` to enable the local CI checks. See [development](docs/development.md) for validation, LOC budgets, and automatic releases.

Licensed under [PolyForm Shield 1.0.0](LICENSE).
