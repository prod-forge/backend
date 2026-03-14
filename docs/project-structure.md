# Project Structure

<p align="center">
  <img alt="Project Structure" src="https://github.com/prod-forge/backend/blob/main/assets/project-structure.png" width="512px" height="406px">
</p>

A well-structured project is critical for long-term maintainability and scalability.

The primary principle when designing the project structure is modularity. Each module should have clear boundaries and a
well-defined responsibility.

Following a modular architecture makes it significantly easier to:

- maintain the codebase
- scale the application
- refactor functionality
- extract parts of the system into separate services if necessary

As the application grows, some modules may evolve into independent services. A modular structure makes this transition
much simpler.

## API Layer

One architectural decision used in this project is separating the API layer from the rest of the application.

Controllers are placed inside a dedicated directory:

```shell
src/api
```

This directory contains everything related to the external interface of the service:

- controllers
- request DTOs
- response DTOs
- query DTOs
- validation logic

Grouping these components together creates a clear boundary between the API layer and the business logic layer.

### Thin Controllers

Controllers should remain thin and focused on handling HTTP concerns only.

A controller should be responsible for:

- defining endpoints
- describing endpoints using Swagger / OpenAPI
- validating request data using DTOs
- validating query parameters
- invoking the appropriate service method

Controllers should not contain business logic.

Instead, they should delegate all domain logic to the service layer.

Example responsibilities of a controller:

- parse incoming requests
- validate DTOs
- call a service
- return a structured response

This keeps controllers predictable and easy to maintain.

## Data Validation and Sanitization

All incoming data should be validated before reaching the service layer.

DTOs should define:

- request payload structure
- query parameters
- response schemas

Additionally, unnecessary or unsafe fields should be removed during validation. This ensures that only explicitly
allowed data reaches the business logic layer.

This approach improves both security and predictability.

## Unified API Responses

One of the most important API design principles is consistent response formatting.

All API responses should follow the same structure, regardless of whether the request succeeds or fails.

Example successful response:

```shell
{
  "data": {}
}
```

Example error response:

```shell
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid request payload"
  }
}
```

Key principles:

- the HTTP status code indicates success or failure
- successful responses return data inside the data field
- error responses contain structured error information

A consistent response format provides several advantages:

- simplifies frontend integration
- improves API predictability
- makes logging and monitoring easier
- reduces ambiguity when handling errors

Maintaining a unified response format across the entire API is a small design decision that has a large long-term impact
on developer experience.
