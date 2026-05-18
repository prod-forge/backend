---
name: project-client-logs
description: ClientLogsModule — stub service for web/mobile log ingestion, plan to upload to S3
metadata:
  type: project
---

`ClientLogsService.processWebLog` and `processMobileLog` are currently stubs (no-op).

**Why:** S3 upload logic is planned but not yet implemented.

**How to apply:** When extending ClientLogsService, implement S3 upload; don't add interim logging logic that would need to be removed.
