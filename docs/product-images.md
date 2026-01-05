# Product Images Schema

This project now stores image metadata as structured subdocuments instead of plain string URLs.

Schema (summary):
- `images` (Array of objects)
  - `filename` - server-side filename (e.g., `abcd1234-detail.webp`)
  - `detail` - `{ filename, url }` (1200×1200 max WebP)
  - `thumb` - `{ filename, url }` (400×400 WebP)
  - `alt` - alt-text
  - `isPrimary` - boolean to mark the main image
  - `uploadedAt` - timestamp

Benefits:
- Easier to store multiple variants (detail/thumb)
- Store metadata (alt text, isPrimary)
- More robust for front-end consumption

Migration:
1. Ensure your `.env` and DB are reachable by the app.
2. Run `npm run migrate:images` — this script converts existing product image string array entries into structured objects (detail & thumb set to the original URL) and will also convert `Category.image` string entries to the structured format.
3. Verify a sample of products and categories in DB after migration.

API / Upload flow:
- Upload endpoint returns `{ detail: { filename, url }, thumb: { filename, url }, filename, reused }` per file.
- When creating/updating a product, send `images` as an array of the returned objects (or old string URLs — the server will normalize them).

If you'd like, I can add a script to reverse the migration or add more tests; tell me which you'd prefer next.