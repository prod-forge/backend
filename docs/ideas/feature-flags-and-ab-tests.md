# Feature flags and A/B tests

## Problem

Every change reaches all users at once when it is deployed. There is no way to ship code behind a switch, roll it out gradually or compare two variants.

## Direction

- Feature flags: a flag provider (self-hosted or SaaS, for example via the OpenFeature standard), flag evaluation in the API and in both frontend clients, a convention for removing stale flags.
- A/B tests: assigning users to variants on top of the flags, and recording the variant in logs and traces so results can be compared.
- Open question: whether the flags live in the backend repo only or are shared with the frontend.
