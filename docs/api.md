# API reference

The Cloud Tools API brings file conversion to your own applications. Upload a file, queue its processing, and download the result.

> Self-hosted and intended for a private installation. API requests upload files to your configured installation. Add an authenticated gateway before exposing these routes.

<div class="api-base"><span>Next.js API · local development</span><code>http://localhost:3000</code></div>

## Base URL and access

Use the origin serving your Next.js app, such as `http://localhost:3000` for development. These routes currently have no built-in authentication or per-user authorization. Keep an installation private or put it behind an authenticated gateway. CORS is not authentication.

## Upload a file

`POST /api/upload` accepts multipart form data: `file`, `operation` (`convert` or `compress`), and optional `targetFormat`.

```sh
curl --fail-with-body "http://localhost:3000/api/upload" \
  -F "file=@example.png" \
  -F "operation=convert" \
  -F "targetFormat=webp"
```

A successful response contains `success: true` and `data.jobId`, plus file and storage metadata. Uploading creates the record but does not enqueue processing.

## Queue processing

`POST /api/process` accepts JSON:

```json
{
  "jobId": "COPY_JOB_ID_FROM_UPLOAD",
  "operation": "convert",
  "targetFormat": "webp"
}
```

For compression, send `operation: "compress"` and optionally `quality` (the default is 80). The response includes `data.jobId` and `data.messageId`. It acknowledges queue submission, not conversion completion. The API does not deduplicate repeated submissions.

## Read jobs

| Request                                   | Result                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/jobs?jobId=ID`                  | One job in `data`, or 404                                                 |
| `GET /api/jobs?status=completed&limit=50` | Matching jobs in `data`                                                   |
| `PUT /api/jobs`                           | Worker status update with `jobId`, `status`, and optional progress/output |
| `GET /api/health`                         | Service health response                                                   |

Listing uses a DynamoDB scan, not a complete paginated history. A scan filter may return fewer rows than the requested limit.

## Errors and limits

Missing required input returns 400; missing jobs return 404; backend failures generally return 500 with `error` and sometimes `details`. There is no dedicated 429 rate-limit contract. Configure file-size, timeout, access, and rate limits at your gateway.

`GET /api/process?action=queue-status` returns placeholder counts. `DELETE /api/process?jobId=ID` does not stop actual work. See [job limitations](jobs.md).
