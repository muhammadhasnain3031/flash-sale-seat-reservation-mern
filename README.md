# Flash Sale Seat Reservation System (MERN)

### 1. How we made overselling impossible
To completely eliminate race conditions under a 100-parallel-request load, we implemented native **MongoDB Database Transactions (`session.withTransaction`)** combined with document counts bound strictly inside the same transactional session block. When simultaneous requests stream in, the atomicity constraints ensure each transaction reads a consistent point-in-time snapshot. If the count reaches 30, the transaction aborts instantly before executing any creation queries, guaranteeing overselling is mathematically impossible.

### 2. How expired holds release seats safely

We use a hybrid approach: MongoDB's native **TTL (Time-To-Live) Background Index** on
the `expiresAt` field acts as the storage-level cleanup mechanism, permanently deleting
expired hold documents in the background.

However, since MongoDB's TTL monitor runs on a ~60-second sweep cycle (not instantly),
we cannot rely on it alone for correctness. So every read/write path that decides
seat availability — `reserve()`, `confirm()`, and `status()` — performs an
**explicit on-read check** against `expiresAt` and `status` at query time
(`expiresAt: { $gt: new Date() }` for held seats, alongside `status: "confirmed"`).

This means a hold is treated as released the instant its 2-minute window passes,
regardless of whether MongoDB's background TTL sweep has physically deleted the
document yet. TTL indexing is the eventual cleanup; explicit query-level filtering
is the source of truth for correctness.



### 3. Trade-offs made due to 24-hour limit
Instead of establishing dual-way state notification loops like WebSockets or Server-Sent Events (SSE) for frontend counters, we utilized client-side short interval polling (every 3 seconds). This allowed us to channel maximum focus toward engineering robust, bulletproof concurrency handlers on the backend layer to securely handle heavy stress load tests.
