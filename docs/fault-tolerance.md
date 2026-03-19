# Fault Tolerance

<p align="center">
  <img alt="Fault Tolerance" src="https://github.com/prod-forge/backend/blob/main/assets/fault-tolerance.png" width="680px" height="271px">
</p>

## Fault vs Failure

It’s important to distinguish between two types of issues in a system: fail and failure.

A **Fault (Non-Critical Dependency)** occurs when a non-critical part of the system is not working or is functioning incorrectly.
In this case, the system as a whole continues to operate, but:

- the user may experience partial degradation of functionality
- some features may be temporarily unavailable
- or a fallback mechanism is used to preserve the core user experience

A **Failure (Critical Dependency)** occurs when a critical part of the system fails, or the entire system becomes unavailable.
For example:

- the database is unavailable
- the application cannot serve requests
- core business logic is broken

In _Data Intensive Application_ book (Martin Kleppmann):

> Faults should be tolerated,
> while Failures should be prevented or minimized.

This project demonstrates a simple fault-tolerance strategy using Redis as an example.

## Non-Critical Dependency

In this architecture, Redis is treated as a non-critical component.

If Redis becomes unavailable, the system continues functioning using fallback strategies instead of crashing.

Redis integration is implemented inside the redis-manager module.

```shell
src/modules/redis-manager/
```

In this project Redis is used for two main purposes:

- caching
- request throttling (rate limiting)

### Fallback Strategies

Fallback mechanisms are implemented inside the storages directory.

```shell
src/modules/redis-manager/storages/
```

These implementations demonstrate how the system can gracefully degrade when Redis is not available.

#### Caching Strategy

Redis caching is considered a performance optimization, not a critical system dependency.

If Redis becomes unavailable, caching is simply skipped and the application reads data directly from the database.

This ensures that the system remains functional even if performance temporarily degrades.

#### Throttling Strategy

Rate limiting is more important for system stability, so a fallback is implemented.

If Redis is unavailable, the application switches to an in-memory fallback using a simple Map structure.

This allows the throttling mechanism to continue working, although with some limitations:

- limits apply only per instance
- data resets when the service restarts

Even with these constraints, this fallback provides basic protection against abuse while Redis is unavailable.

## Types of Fault Tolerance

Fault-tolerant systems are often discussed in two categories (as described by Martin Kleppmann):

This project follows High Availability principles - the end user does not see the difference when working with the
application.

### High Availability

High Availability - the system continues to operate without noticeable disruption. Failures are handled
transparently, and the user does not see that a fallback or recovery mechanism was triggered.

### Graceful Degradation

Graceful Degradation - the system remains partially available, but the user may notice issues, such
as reduced functionality or visible errors, while core parts of the system still work.

## Critical Dependency

The database is a critical dependency. If database is not available, the application will shutdown:

```typescript
if (this.config.databaseFailFast) {
  process.exit(1);
}
```
