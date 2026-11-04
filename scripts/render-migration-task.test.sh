#!/usr/bin/env bash
# Checks scripts/render-migration-task.sh with an app task definition whose environment holds JSON values
# (quotes and brackets). Requires jq. Run from the repository root.
set -euo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cat > "$work/app-task.json" <<'JSON'
{
  "executionRoleArn": "arn:aws:iam::123456789012:role/execution",
  "taskRoleArn": "arn:aws:iam::123456789012:role/task",
  "containerDefinitions": [
    {
      "environment": [
        { "name": "API_ALLOWED_ORIGINS", "value": "[\"https://example.com\",\"https://d1.cloudfront.net\"]" },
        { "name": "DATABASE_LOG_LEVELS", "value": "[\"warn\",\"error\"]" },
        { "name": "DATABASE_HOST", "value": "db.example.internal" }
      ],
      "secrets": [
        { "name": "DATABASE_PASSWORD", "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:rds|x:password::" }
      ]
    }
  ]
}
JSON

IMAGE="123456789012.dkr.ecr.eu-central-1.amazonaws.com/app:1.2.3" NAME="app-migration-task" REGION="eu-central-1" \
  LOG_GROUP="/ecs/app-task-migration" \
  scripts/render-migration-task.sh ecs/migration-task.json "$work/app-task.json" > "$work/rendered.json"

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

jq -e . "$work/rendered.json" > /dev/null || fail 'rendered task definition is not valid JSON'
grep -q '__[A-Z_]*__' "$work/rendered.json" && fail 'placeholders left in the rendered task definition'

jq -e --slurpfile app "$work/app-task.json" '
  .containerDefinitions[0].environment == $app[0].containerDefinitions[0].environment
  and .containerDefinitions[0].secrets == $app[0].containerDefinitions[0].secrets
  and (.containerDefinitions[0].environment[0].value | fromjson) == ["https://example.com", "https://d1.cloudfront.net"]
  and .executionRoleArn == $app[0].executionRoleArn
  and .taskRoleArn == $app[0].taskRoleArn
  and .family == "app-migration-task"
  and .containerDefinitions[0].image == "123456789012.dkr.ecr.eu-central-1.amazonaws.com/app:1.2.3"
  and .containerDefinitions[0].logConfiguration.options["awslogs-group"] == "/ecs/app-task-migration"
  and .containerDefinitions[0].logConfiguration.options["awslogs-region"] == "eu-central-1"
' "$work/rendered.json" > /dev/null || fail 'rendered values differ from the app task definition'

echo 'render-migration-task: OK'
