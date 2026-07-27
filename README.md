# Flash Sale Seat Reservation System (MERN)

### 1. How we made overselling impossible
To completely eliminate race conditions under a 100-parallel-request load, we implemented native **MongoDB Database Transactions (`session.withTransaction`)** combined with document counts bound strictly inside the same transactional session block. When simultaneous requests stream in, the atomicity constraints ensure each transaction reads a consistent point-in-time snapshot. If the count reaches 30, the transaction aborts instantly before executing any creation queries, guaranteeing overselling is mathematically impossible.

### 2. How expired holds release seats safely
We leveraged MongoDB's native **TTL (Time-To-Live) Background Indexes** on the `expiresAt` timeline field. Holds are written with a strict 2-minute expiration life. Upon passing this time window, MongoDB safely purges the expired state documents. Because counting checks (`countDocuments`) evaluate real-time persistent records inside ACID sessions, dropped holds immediately reflect as available slots in parallel pipelines without creating processing blockages or memory leaks.

### 3. Trade-offs made due to 24-hour limit
Instead of establishing dual-way state notification loops like WebSockets or Server-Sent Events (SSE) for frontend counters, we utilized client-side short interval polling (every 3 seconds). This allowed us to channel maximum focus toward engineering robust, bulletproof concurrency handlers on the backend layer to securely handle heavy stress load tests.
