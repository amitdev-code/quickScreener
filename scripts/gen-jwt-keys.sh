#!/usr/bin/env bash
# Generates an RS256 key pair and appends them to apps/api/.env
# Usage: bash scripts/gen-jwt-keys.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../apps/api/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$SCRIPT_DIR/../.env.example" "$ENV_FILE"
  echo "Created apps/api/.env from .env.example"
fi

PRIVATE_KEY=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null)
PUBLIC_KEY=$(echo "$PRIVATE_KEY" | openssl rsa -pubout 2>/dev/null)

# Escape newlines for single-line .env values
PRIVATE_KEY_ESCAPED=$(echo "$PRIVATE_KEY" | awk '{printf "%s\\n", $0}')
PUBLIC_KEY_ESCAPED=$(echo "$PUBLIC_KEY" | awk '{printf "%s\\n", $0}')

# Replace placeholder values
sed -i.bak "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=\"$PRIVATE_KEY_ESCAPED\"|" "$ENV_FILE"
sed -i.bak "s|^JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=\"$PUBLIC_KEY_ESCAPED\"|" "$ENV_FILE"
rm -f "$ENV_FILE.bak"

echo "RS256 key pair written to $ENV_FILE"
