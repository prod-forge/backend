# Error Handling

<p align="center">
  <img alt="Error Handling" src="https://github.com/prod-forge/backend/blob/main/assets/error-handling.png" width="768px" height="338px">
</p>

Errors in backend applications usually fall into several categories.
Understanding these categories helps design a predictable and reliable error-handling strategy.

## Types of Errors

### Business Logic Errors

Business logic errors are typically non-fatal and occur when a user performs an action that violates application rules.

Examples:

- a user tries to register with an already existing email
- insufficient balance for a payment
- invalid state transition

These errors should be communicated clearly to the user, allowing them to correct the issue.

The goal is not just to reject the request, but to provide enough information for the user to understand what went
wrong.

### Database Errors

Database-related errors are often similar to business logic errors, although they originate from the persistence layer.

Example scenarios:

- unique constraint violations
- attempting to insert duplicated data
- invalid foreign key references

In such cases, the application should translate low-level database errors into meaningful user-facing messages.

Users should never see raw database errors.

### Infrastructure Errors

Infrastructure errors occur when the application cannot communicate with external systems.

Examples include:

- database connection failures
- third-party API timeouts
- unavailable infrastructure services

These errors can be critical.

In some cases, the safest strategy is to terminate the service immediately. This approach is known as the fail-fast
principle.

Fail-fast systems stop processing requests when a critical dependency fails and trigger alerts so the issue can be
investigated quickly.

## Custom Errors

To properly handle business logic failures, it is recommended to create custom application errors.

Custom errors allow us to include:

- a clear error message
- an error type
- additional metadata related to the failure

Example use cases:

- UserAlreadyExistsError
- InsufficientBalanceError
- InvalidOrderStateError

Using explicit error classes makes the error handling logic more predictable and easier to maintain.

## Global Exception Handling

A backend application should have a single global exception filter responsible for handling all unhandled errors.

The exception filter performs several important tasks:

- formats API error responses
- hides internal error details from the client
- logs errors
- reports errors to monitoring systems

This ensures that all errors follow the same response format.

## User-Friendly Error Responses

Internal error details should never be exposed to the client, as they may reveal sensitive implementation details.

However, error responses should still be informative and actionable.

Bad example:

```shell
Oops, something went wrong
```

Better example:

```shell
Insufficient funds to complete the transaction
```

If a user can fix the problem, the error message should clearly explain how.

## Error Monitoring (Sentry)

The global exception filter should integrate with an error monitoring system such as Sentry.

Sentry should receive as much contextual information as possible to help debug issues.

Example:

```shell
Sentry.captureException(exception, {
  extra: {
    body: req.body,
    correlationId,
    params: req.params,
    query: req.query,
  },
});
```

Providing request context helps reproduce and investigate errors.

### Correlation ID

The correlation ID is particularly important.

It connects application logs, metrics, and error reports together, allowing engineers to trace the full lifecycle of a
request.

With a correlation ID, it becomes possible to track a failure from the initial request to the final error.

### User Context

Whenever possible, it is also useful to attach user information to the error report.

Example:

```shell
Sentry.setUser({ userId });
```

This can be extremely valuable when investigating production issues.

In some cases, a bug may only affect a specific user or a specific dataset. Having the user identifier allows engineers
to quickly identify the affected account and reproduce the issue.

## Logging and Metrics

The exception filter should also integrate with:

- the application logger
- metrics collection systems

Tracking error metrics allows teams to monitor system health.

Example metric:

```shell
private readonly httpErrors = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'status'],
});
```

These metrics can be exported to monitoring systems such as Prometheus or Grafana, enabling dashboards and alerts based
on error rates.
