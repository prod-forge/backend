# Roadmap

Open work only. Everything else is shipped; see the [prod-forge organization](https://github.com/prod-forge) for the full set of repositories.

- Deployment
  - Kubernetes (EKS)
  - Blue/green deployment
- Development Workflow
  - Feature flags
  - Pin GitHub Actions to commit SHAs
  - Drop the `effect` override under `@prisma/config` once Prisma ships `effect` >=3.22.1 (GHSA-7589-6fvf-x4pw)
- Testing
  - A/B testing
- Architecture Decisions
  - Cost analysis
- Logging & Observability
  - Alertmanager routing of Prometheus alerts to SNS
  - SLO burn-rate alerts
