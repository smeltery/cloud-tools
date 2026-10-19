# Overview

Practical file conversion and compression, in one self-hostable toolbox.

## Make your files work for you

Cloud Tools converts images, audio, video, and eBooks, and compresses images and PDFs. Use the browser interface for individual files, or the HTTP API to submit jobs from another application. Processing happens on a worker connected to your storage and queue.

## How a conversion works

```mermaid
flowchart LR
    Upload[Upload a file] --> Choose[Choose a format]
    Choose --> Queue[Queue a job]
    Queue --> Worker[Process the file]
    Worker --> Download[Download the result]
```

The browser uploads your original, queues the requested operation, and gives you a job ID. The worker writes the output and updates the job. Your original upload and converted output are separate objects.

## What you need

Use a running Cloud Tools installation with its storage, queue, database, and worker configured. To run your own, follow the [quick start](quick-start.md). The interface alone cannot process files.

## Files and privacy

Files are uploaded to the server's configured S3 storage; this is not browser-only processing. Retention and download access depend on the operator's configuration. Do not assume a fixed deletion window or that uploads are private by default. See [self-hosting](deployment.md) before using sensitive files.

## Where to go next

- [Convert your first file](conversion.md)
- [Check supported formats](formats.md)
- [Track jobs and download results](jobs.md)
- [Integrate with the API](api.md)
- [Understand the architecture](architecture.md)
