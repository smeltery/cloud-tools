# Troubleshooting

Start with the job ID and the first failing step.

## Upload fails

Confirm LocalStack or AWS is reachable and that the configured bucket and jobs table exist. Check the web server logs for the returned error. If only large files fail, inspect your hosting request-size and timeout limits. Try a small non-sensitive image to isolate configuration from file size.

## A job stays in processing

Verify the worker is running and reading the same queue as the API. Compare resource names in the root `.env.local` and `client/.env.local`. The API sets processing immediately after enqueueing, so this status can mean waiting for a worker.

## A conversion fails

Check that the input is valid and the engine can decode it. Run `ffmpeg -version` for audio/video and `ebook-convert --version` for eBooks on the worker host. Inspect worker logs for details. Unsupported codecs and missing engines are different from an unavailable queue.

## The download cannot be opened

Check the output object's existence and the returned URL. A LocalStack URL using localhost is only reachable from that machine. Production downloads need a deliberate storage endpoint and access policy; the worker does not sign URLs automatically.

## LocalStack is unhealthy

```sh
bun run localstack:status
bun run localstack:logs
bun run localstack:health
```

Make sure Docker is running and port 4566 is available. Inspect the initialization logs for resource creation failures. Use reset only when you intend to discard local data.

## Checks fail locally

Activate Flox, install from the frozen Bun lockfile, and rerun the failing command. Use `bun run format` for formatting. Mermaid errors identify the source file and diagram. LOC failures name the files exceeding their budget; simplify the code instead of increasing limits casually.
