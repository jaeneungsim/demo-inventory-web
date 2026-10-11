#!/usr/bin/env bash
# Points git at the hooks in .githooks (run once per clone).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
chmod +x .githooks/*
git config core.hooksPath .githooks
echo "Git hooks enabled from .githooks."
