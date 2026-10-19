#!/usr/bin/env bash
set -euo pipefail
shellcheck -S error scripts/*.sh infrastructure/scripts/*.sh
terraform fmt -check -recursive infrastructure
for environment in infrastructure/environments/*; do
  terraform -chdir="$environment" init -backend=false -input=false
  terraform -chdir="$environment" validate
 done
