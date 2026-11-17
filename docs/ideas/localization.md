# Localization

## Problem

The API answers in English only: error classes carry fixed messages (for example `TodoNotFoundError.message = 'Todo not found'`), and DTO validation `details` come from class-validator in English. The clients already map error `code` to their own texts, but the validation details and any future server-made text (emails, notifications) have no way to follow the user's language.

## Direction

- Keep `code` the contract: clients translate codes, and the English `message` stays a developer-facing fallback. Validation `details` get stable codes per rule (for example `title.maxLength` with its parameters) instead of only sentences.
- If the server has to produce text (emails, push notifications), resolve the locale from `Accept-Language` or a saved user preference and translate with a NestJS i18n module; store the preference on the user.
- Logs, metrics and Sentry events stay in English regardless of the request locale.
- Open questions: whether localized server texts are needed at all while the API only returns data and codes; how this fits the frontend idea `localization.md` (one shared catalog or one per repository).
