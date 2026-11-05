# Security

<p align="center">
  <img alt="Security" src="assets/security.jpg" width="682px" height="342px">
</p>

Security is a broad topic that depends heavily on the specific system architecture and threat model.

However, several baseline practices should be implemented in any backend API.

## Authentication and Authorization

The API signs and verifies access tokens, but it does not run an identity provider. Verifying a token answers "who is calling"; deciding who a person is and how they prove it (passwords, MFA, social login, account recovery) is a separate, security-critical product that is better delegated to Cognito, Auth0 or Keycloak.

- Tokens are JWTs signed with HS256 using `JWT_SECRET` (at least 32 characters, never committed). The `sub` claim is the user id and `exp` is `now + JWT_TTL` (default 3600 seconds).
- `AuthGuard` verifies the signature and expiry on every protected route and rejects anything else with 401. A token without `sub` is rejected too.
- `POST /api/v1/auth/login` is a stub. It accepts an email and returns a token if the user exists. It has no password on purpose: identity is not authorization, and a stub that pretends to check passwords would be worse than an honest one. It is throttled to 5 requests per minute. A real system delegates login to an identity provider and never exposes such an endpoint.
- Plugging in a real IdP means changing one function, `AuthService.verifyToken`: verify RS256 tokens against the provider's JWKS instead of HS256 with a shared secret. The guard and the controllers stay untouched.
- `JWT_SECRET` is required at startup. Provision a distinct random value (32+ characters) per environment in the secret store that feeds the runtime (for example the ECS task definition secrets) before deploying; rotating it invalidates all issued tokens.
- For local work, `npm run token:issue -- <userId>` prints a token for a given user id.

### Resource Ownership

Authentication says who is calling; it does not say which records that caller may touch. Every todo has an owner (`userId`), and `TodosService` checks it on read, update and delete.

- A todo owned by another user is reported as 404 `TODO_NOT_FOUND`, the same answer as for a todo that does not exist. A 403 would confirm that the id exists and let an attacker enumerate other users' records.
- The check lives in the service, not in the controller, so every caller of the service gets it. The controller only passes the authenticated `userId`.
- `GET /todos/:id` reads the per-todo cache entry first. The cached value carries `userId`, and it is compared with the caller after the hit; a mismatch is a 404 and nothing is written to the cache. Checking only on a cache miss would let user B read user A's cached todo.
- `PATCH` and `DELETE` load the todo from the database (not from the cache, which could be stale) and compare the owner before any write or cache invalidation.

## Request Validation

All incoming data should be validated using DTOs.

NestJS provides a built-in validation pipeline based on class-validator.

Example global validation configuration:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    exceptionFactory: (errors: ValidationError[] = []) => {
      throw new DtoValidationErrors(parseValidationErrors(errors));
    },
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
    whitelist: true,
  }),
);
```

This configuration ensures:

- unknown properties are rejected
- validation stops at the first error
- input data is safely transformed
- sensitive validation details are hidden

## Response Data Sanitization

Outgoing responses should also be sanitized.

DTOs can be used to ensure that only explicitly allowed fields are returned.

Example:

```typescript
return plainToInstance(TodoResponseDto, created, {
  excludeExtraneousValues: true,
});
```

This prevents accidental exposure of internal fields.

## Security Headers

Basic HTTP security headers can be enabled using Helmet.

Example configuration:

```typescript
if (environmentService.isProduction()) {
  app.use(
    helmet({
      hsts: {
        includeSubDomains: true,
        maxAge: 31536000,
        preload: true,
      },
    }),
  );
}
```

Helmet helps protect against several common web vulnerabilities.

## CORS Configuration

CORS should be configured carefully to restrict which origins are allowed to access the API.

Example:

```typescript
// src/app.cors.ts
export const buildCorsOptions = (configApi: ConfigType<typeof apiConfig>): CorsOptions => ({
  credentials: true,
  exposedHeaders: ['X-Trace-Id'],
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, configApi.apiAllowNonBrowserOrigins);

      return;
    }

    cb(null, configApi.apiAllowedOrigins.includes(origin));
  },
});

app.enableCors(buildCorsOptions(configApi));
```

This allows only trusted origins to access the API. `exposedHeaders` lets the web client read the `X-Trace-Id` response header cross-origin (browsers hide non-simple headers otherwise), so an error can be matched to its backend logs.

## Rate Limiting

The project uses **@nestjs/throttler** to limit incoming request rates.

This helps protect the API from:

- abuse
- brute-force attacks
- accidental traffic spikes

Defaults: 60 requests per 60 seconds per client (`THROTTLE_LIMIT`, `THROTTLE_TTL`); locally `.env.common` lowers them to 10 per 20 seconds. `POST /api/v1/auth/login` has its own stricter limit of 5 per minute.

### Behind ALB: `trust proxy`

Behind an Application Load Balancer the TCP peer of every request is the ALB, so without `trust proxy` Express reports the ALB address as `req.ip` and all clients share one rate-limit bucket: the limit becomes global and one noisy client throttles everybody. `TRUST_PROXY` sets the Express `trust proxy` hop count; use `1` behind a single ALB so `req.ip` is taken from `X-Forwarded-For`. Keep it `0` when the app is reachable directly, otherwise clients could spoof their IP with that header.

### Tracker

`UserThrottlerGuard` counts requests per authenticated user (`user:<id>`) and falls back to the client IP (`ip:<ip>`) for anonymous callers. The global throttler runs before the route-level `AuthGuard`, so the tracker verifies the Bearer token itself through `AuthService.verifyToken`; an invalid or missing token simply falls back to the IP.

### Exempt routes

`/health`, `/health/live`, `/health/deps`, `/metrics`, `/metrics/database` and `/version` are marked `@SkipThrottle()`, so probes and scrapers are never blocked. The Prometheus `/metrics` endpoint is served by `PrometheusScrapeController`, a subclass of the library controller passed to `PrometheusModule.register({ controller })`.

### Internal-only metrics

`/metrics` and `/metrics/database` are public and unthrottled, and `/metrics/database` exposes normalized SQL, so they must
not be reachable from the internet. `metricsGateMiddleware` is the first middleware in `appSetup` and returns 404 for any path
matching `/^\/(?:api\/)?metrics(?:\/|$)/i` when the request carries `X-Forwarded-For`. The ALB always appends that header;
Prometheus and the compose stack scrape the task IP directly without it. The match is case-insensitive because Express
routing is (`/METRICS` reaches the scrape handler) while the ALB listener rule that blocks `/metrics*` is not.

### Disabling

Set `THROTTLE_ENABLED=false` to turn rate limiting off (for example in local development). It is `true` by default.

## File Upload Security

If your API accepts file uploads, additional validation and sanitization are required.

Simply validating file type is not enough.

For example, SVG files may contain embedded JavaScript code. If such files are processed by server-side tools (e.g.,
rendering libraries), malicious code could potentially be executed.

Therefore uploaded files should always be:

- validated
- sanitized
- safely processed
