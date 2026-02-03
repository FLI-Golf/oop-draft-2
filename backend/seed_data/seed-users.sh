#!/usr/bin/env bash
set -euo pipefail

# FLI Golf Sample Users Seed Script
# Creates sample users for each role

PB_URL="${PB_URL:-http://127.0.0.1:8090}"
PASSWORD="MADcap(123)"

echo "Seeding FLI Golf sample users..."
echo "PocketBase URL: $PB_URL"
echo ""

# Users: email:name:role
users=(
  "admin_1@fligolf.com:Admin User 1:Admin"
  "admin_2@fligolf.com:Admin User 2:Admin"
  "scorekeeper_1@fligolf.com:Scorekeeper 1:Scorekeeper"
  "scorekeeper_2@fligolf.com:Scorekeeper 2:Scorekeeper"
  "pro_1@fligolf.com:Pro Player 1:Pro"
  "pro_2@fligolf.com:Pro Player 2:Pro"
  "basic_user_1@fligolf.com:Basic User 1:Basic User"
  "basic_user_2@fligolf.com:Basic User 2:Basic User"
  "basic_user_3@fligolf.com:Basic User 3:Basic User"
  "basic_user_4@fligolf.com:Basic User 4:Basic User"
)

create_user() {
  local email="$1"
  local name="$2"
  local role="$3"
  
  curl -s -X POST "$PB_URL/api/collections/users/records" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"passwordConfirm\":\"$PASSWORD\",\"name\":\"$name\",\"role\":\"$role\"}"
}

echo "Creating sample users (password: $PASSWORD)..."
echo ""

for user_data in "${users[@]}"; do
  email=$(echo "$user_data" | cut -d: -f1)
  name=$(echo "$user_data" | cut -d: -f2)
  role=$(echo "$user_data" | cut -d: -f3)
  
  response=$(create_user "$email" "$name" "$role")
  
  # Check if successful
  if echo "$response" | grep -q '"id"'; then
    echo "✅ $email ($role)"
  else
    error=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "⚠️  $email - ${error:-already exists or failed}"
  fi
done

echo ""
echo "🎉 Seed complete:"
echo "   - 2 Admin users"
echo "   - 2 Scorekeeper users"
echo "   - 2 Pro users"
echo "   - 4 Basic User users"
echo ""
echo "All passwords: $PASSWORD"
