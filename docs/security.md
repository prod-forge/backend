# Security

<p align="center">
  <img alt="Security" src="assets/security.png" width="682px" height="342px">
</p>

Security is a broad topic that depends heavily on the specific system architecture and threat model.

However, several baseline practices should be implemented in any backend API.

## Authentication and Authorization

The API signs and verifies access tokens, but it does not run an identity provider. Verifying a token answers "who is calling"; deciding who a person is and how they prove it (passwords, MFA, social login, account recovery) is a separate, security-critical product that is better delegated to Cognito, Auth0 or Keycloak.

- Tokens are JWTs signed with HS256 using `JWT_SECRET` (at least 32 characters, never committed). The `sub` claim is the user id and `exp` is `now + JWT_TTL` (default 3600 seconds).
- `AuthGuard` verifies the signature and expiry on every protected route and rejects anything else with 401. A token without `sub` is rejected too.
- `POST /api/v1/auth/login` is a stub. It accepts an email and returns a token if the user exists. It has no password on purpose: identity is not authorization, and a stub that pretends to check passwords would be worse than an honest one. It is throttled to 5 requests per minute. A real system delegates login to an identity provider and never exposes such an endpoint.
- Plugging in a real IdP means changing one function, `AuthService.verifyToken`: verify RS256 tokens against the provider's JWKS instead of HS256 with a shared secret. The guard and the controllers stay untouched.
- For local work, `npm run token:issue -- <userId>` prints a token for a given user id.

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
app.enableCors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) {
      return configApi.apiAllowNonBrowserOrigins ? cb(null, true) : cb(null, false);
    }

    return configApi.apiAllowedOrigins.includes(origin) ? cb(null, true) : cb(null, false);
  },
});
```

This allows only trusted origins to access the API.

## Rate Limiting

The project uses **@nestjs/throttler** to limit incoming request rates.

This helps protect the API from:

- abuse
- brute-force attacks
- accidental traffic spikes

Rate limiting can be disabled in development environments to avoid interfering with testing.

## File Upload Security

If your API accepts file uploads, additional validation and sanitization are required.

Simply validating file type is not enough.

For example, SVG files may contain embedded JavaScript code. If such files are processed by server-side tools (e.g.,
rendering libraries), malicious code could potentially be executed.

Therefore uploaded files should always be:

- validated
- sanitized
- safely processed
