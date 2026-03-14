# Fault Tolerance

<p align="center">
  <img alt="Fault Tolerance" src="https://github.com/prod-forge/backend/blob/main/assets/fault-tolerance.png" width="680px" height="271px">
</p>

Most application errors are not critical and should not cause the entire system to fail.

A well-designed system should continue operating even when some components become temporarily unavailable.

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

## Graceful Degradation

This approach is an example of graceful degradation.

Instead of failing completely when a dependency is unavailable, the system reduces functionality while keeping the core
service operational.

Key principles demonstrated here:

- treat optional components as optional
- implement fallback mechanisms where possible
- keep the core application functional

This strategy significantly improves the reliability of production systems.
