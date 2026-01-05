# Uploads (S3 + Image processing)

This route provides a common image upload endpoint with validation, conversion to WebP, and optional resize.

Endpoint
- POST /api/v1/uploads/upload
- Form field: `images` (files[])
- Optional query params: `width`, `height` (resize)

Behavior
- Validates S3 configuration (AWS_REGION and AWS_S3_BUCKET_NAME required)
- Accepts common image MIME types (jpeg, png, webp)
- Converts and stores images as WebP (quality 80)
- Generates two variants per image: `detail` (1200×1200 max, WebP quality ~80) and `thumb` (400×400, WebP quality ~80)
- Returns per-file results: `{ ok: true, originalName, detail: { filename, url, reused }, thumb: { filename, url, reused } }` on success or `{ ok: false, error, originalName }` on failure

Example response (200):

```
{
  "results": [
    {
      "ok": true,
      "originalName": "shirt.png",
      "detail": { "filename": "abcd1234-detail.webp", "url": "https://.../abcd1234-detail.webp", "reused": false },
      "thumb": { "filename": "abcd1234-thumb.webp", "url": "https://.../abcd1234-thumb.webp", "reused": false }
    }
  ]
}
```
- Partial success returns HTTP 207 with results

Notes
- Ensure `AWS_S3_BUCKET_NAME`, `AWS_REGION`, and optionally `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in env.
- Uses `p-map` with concurrency 3 to process uploads concurrently.
- Adjust `sharp` quality or max file size in `uploadRoutes.js` as needed.
