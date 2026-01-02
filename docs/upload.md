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
- Returns per-file results: `{ ok: true, url, filename, originalName }` on success or `{ ok: false, error, originalName }` on failure
- Partial success returns HTTP 207 with results

Notes
- Ensure `AWS_S3_BUCKET_NAME`, `AWS_REGION`, and optionally `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in env.
- Uses `p-map` with concurrency 3 to process uploads concurrently.
- Adjust `sharp` quality or max file size in `uploadRoutes.js` as needed.
