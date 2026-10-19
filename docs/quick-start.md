# Quick start

Run the interface locally, then connect the processing services when you need real conversions.

## Prepare your environment

Install [Flox](https://flox.dev/docs/install-flox/) and clone the repository:

```sh
git clone https://github.com/smeltery/cloud-tools.git
cd cloud-tools
flox activate
bun install --frozen-lockfile
bun run hooks:install
```

The checked-in Flox environment provides Bun, Node.js, Terraform, AWS CLI, FFmpeg, ShellCheck, and pre-commit. Docker must be running separately. For eBooks, install Calibre and ensure `ebook-convert` is on your worker's PATH.

## Preview the interface

```sh
bun run dev
```

Open `http://localhost:3000`. The home page and documentation work without AWS. Uploads, jobs, and health checks need the backend below. Alternatively use `flox services start web` inside the environment.

## Start local processing

```sh
bun run setup
bun run localstack:health
```

Setup creates local environment files and starts LocalStack through Docker Compose. Provision the bucket, queue, and jobs table with `bun run localstack:provision`. Check the container logs if resources are unavailable.

In separate terminals inside the Flox environment:

```sh
bun run dev
bun run worker
```

The worker reads the root `.env.local`; Next.js reads `client/.env.local`. Keep resource names and endpoint values consistent. Use `NODE_ENV=development` for LocalStack; the worker command sets it. See [configuration](deployment.md).

## Try a conversion

Open the image converter, choose a small PNG, select WebP, and convert. Track the job ID on the Jobs page. Download the output only after it reports completion. If the job stalls, use the [troubleshooting guide](troubleshooting.md).

## Stop services

Stop foreground processes with Ctrl+C. Use `flox services stop web` for the managed preview and `bun run localstack:stop` for LocalStack. Stopping is different from resetting: reset deletes local data.
