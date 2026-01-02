# Redis Caching (short guide)

✅ What I added
- `src/config/redis.js` — Redis client and connect helper
- `src/utils/cache.js` — small cache wrapper with get/set/del/delPattern
- Caching for product and category read endpoints (`productService`, `categoryService`) with TTLs and invalidation on create/update/delete

⚙️ How to enable
1. Install dependency:
   npm install redis

2. Set an environment variable (optional):
   - `REDIS_URL` (defaults to `redis://localhost:6379`)

3. Start a Redis server locally (if you don't have one):
   - On macOS: `brew install redis && brew services start redis`
   - On Windows: use a Redis installer or run via Docker: `docker run -p 6379:6379 redis`

💡 Notes
- Listing queries are cached with short TTLs (300–600s) to keep data fresh.
- Single-entity caches use longer TTL (3600s). Cache is invalidated on changes.
- `delPattern` uses `KEYS` internally; it is ok for small projects but consider using Redis tags or a more advanced approach for large datasets.

If you want, I can:
- Add cache headers to responses
- Add a middleware to allow clients to bypass cache via a query param
- Add tests to verify cache behavior
