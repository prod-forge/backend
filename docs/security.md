# Security

Security is a broad topic that depends heavily on the specific system architecture and threat model.

However, several baseline practices should be implemented in any backend API.

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
