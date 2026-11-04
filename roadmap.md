# Roadmap

Open work only. Everything else is shipped; see the [prod-forge organization](https://github.com/prod-forge) for the full set of repositories.

- Deployment
  - Kubernetes (EKS)
  - Blue/green deployment
- Development Workflow
  - Feature flags
  - Pin GitHub Actions to commit SHAs
  - NestJS 12 (`@nest-lab/throttler-storage-redis` still declares NestJS 11 peers), then drop the `multer` override from `package.json`
- Testing
  - A/B testing
- Architecture Decisions
  - Cost analysis
- Logging & Observability
  - Alertmanager routing of Prometheus alerts to SNS
  - SLO burn-rate alerts
