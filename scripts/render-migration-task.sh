#!/usr/bin/env bash
# Renders ecs/migration-task.json for `aws ecs register-task-definition`. jq sets every value, so environment
# values that are JSON themselves (API_ALLOWED_ORIGINS, DATABASE_LOG_LEVELS) keep their escaping.
# Usage: render-migration-task.sh <template> <app-task-definition.json>
# Env: IMAGE, NAME, REGION, LOG_GROUP. Roles, environment and secrets are copied from the app task definition.
set -euo pipefail

template="$1"
app_task="$2"

jq \
  --slurpfile app "$app_task" \
  --arg image "$IMAGE" \
  --arg name "$NAME" \
  --arg region "$REGION" \
  --arg log_group "$LOG_GROUP" \
  '.family = $name
   | .executionRoleArn = $app[0].executionRoleArn
   | .taskRoleArn = $app[0].taskRoleArn
   | .containerDefinitions[0].image = $image
   | .containerDefinitions[0].environment = $app[0].containerDefinitions[0].environment
   | .containerDefinitions[0].secrets = $app[0].containerDefinitions[0].secrets
   | .containerDefinitions[0].logConfiguration.options["awslogs-group"] = $log_group
   | .containerDefinitions[0].logConfiguration.options["awslogs-region"] = $region' \
  "$template"
