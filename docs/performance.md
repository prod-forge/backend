# Performance

<p align="center">
  <img alt="Performance" src="assets/performance.png" width="611px" height="329px">
</p>

Performance optimization is a complex topic and heavily depends on the specific project and workload.

However, there are several general principles that apply to most backend systems.

## Avoid Returning Unnecessary Data

Do not return large payloads if they are not required.

This improves:

- API performance
- bandwidth usage
- security (less data exposure)

## Use Pagination for Collections

Endpoints that return collections should always support pagination.

This prevents:

- large database queries
- excessive memory usage
- slow responses

Pagination also makes APIs easier to consume.

## Use Database Indexes (When Needed)

Indexes can significantly improve database performance for frequently queried fields.

However, they should be used carefully.

Too many indexes can negatively affect:

- write performance
- storage usage

Indexes should be introduced only when necessary.

## Response Compression

In some cases it may be beneficial to compress responses using gzip.

Example configuration:

```typescript
app.use(compression({ threshold: 1024 }));
```

In this example compression is applied only to responses larger than 1 KB.

Compression can reduce network traffic, but it should be used only when it provides real benefits.

## Cache Invalidation Without KEYS

Never use the Redis `KEYS` command in production code: it scans the whole keyspace in a single blocking call and stalls all other clients. Pattern deletion uses `SCAN` with `COUNT 100` and `UNLINK` (non-blocking delete) in batches. Track cache effectiveness with the `cache_operations_total` metric and the "Cache hit ratio" dashboard panel.
