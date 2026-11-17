# High load: load testing and scaling

## Problem

The guide shows a production-ready service but does not show how it behaves under load. The only load test is `load/k6-smoke.js`: 10 virtual users for 30 seconds against a local stack (`load/docker-compose.load.yml`), with p95 < 300 ms and < 1% failed requests as thresholds. There is no capacity number, no stress or soak test and no scaling story.

## Direction

- Load test types beyond the smoke run: load, stress, spike, soak; a target RPS and a measured capacity per instance.
- Run the tests against the deployed AWS environment, not only locally, and read the results in the existing observability stack.
- Scaling: horizontal scaling of the API, database connection limits and pooling, read replicas, cache strategy with Redis.
- Open question: whether load tests run in CI or only on demand, given the AWS cost.
