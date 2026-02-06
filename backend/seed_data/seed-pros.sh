#!/usr/bin/env bash
set -euo pipefail

PB_URL="${PB_URL:-http://127.0.0.1:8090}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-}"

echo "Seeding FLI Golf pros and teams..."
echo "PocketBase URL: $PB_URL"
echo ""

if [[ -z "$PB_ADMIN_EMAIL" || -z "$PB_ADMIN_PASSWORD" ]]; then
  echo "Error: Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD env vars."
  exit 1
fi

AUTH_JSON="$(curl -sS -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$PB_ADMIN_EMAIL\",\"password\":\"$PB_ADMIN_PASSWORD\"}")"

if [[ -z "$AUTH_JSON" ]]; then
  echo "Error: Empty response from PocketBase auth endpoint."
  exit 1
fi

TOKEN="$(node -e 'const s=process.argv[1]; try{console.log(JSON.parse(s).token||"")}catch(e){console.log("")}' "$AUTH_JSON")"

if [[ -z "$TOKEN" ]]; then
  echo "Error: Failed to authenticate superuser."
  echo "$AUTH_JSON"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

teams=(
  "Hyzer Heros"
  "Huk-a-Mania"
  "Flight Squad"
  "Birdie Storm"
  "Chain Breakers"
  "Disc Jesters"
  "Midas Touch"
  "Chain Seekers"
  "Fairway Bombers"
  "Disc Dynasty"
  "Ace Makers"
  "Glide Masters"
)

male_pros=(
  "Gannon Buhr:1050:1"
  "Ricky Wysocki:1045:2"
  "Calvin Heimburg:1040:3"
  "Isaac Robinson:1035:4"
  "Paul McBeth:1030:5"
  "Kyle Klein:1025:6"
  "Matthew Orum:1020:7"
  "Anthony Barela:1015:8"
  "Niklas Anttila:1010:9"
  "Chris Dickerson:1005:10"
  "Simon Lizotte:1000:11"
  "Ezra Robinson:995:12"
)

female_pros=(
  "Kristin Tattar:1000:1"
  "Evelina Salonen:995:2"
  "Ohn Scoggins:990:3"
  "Missy Gannon:985:4"
  "Holyn Handley:980:5"
  "Silva Saarinen:975:6"
  "Ella Hansen:970:7"
  "Hailey King:965:8"
  "Heidi Laine:960:9"
  "Paige Pierce:955:10"
  "Kat Mertsch:950:11"
  "Natalie Ryan:945:12"
)

reserve_males=(
  "Aaron Gossage:985"
  "Corey Ellis:980"
)

reserve_females=(
  "Valerie Mandujano:940"
  "Rebecca Cox:935"
)

get_id() {
  echo "$1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

create_player() {
  local name="$1"
  local gender="$2"
  local rating="$3"
  local ranking="${4:-}"

  local data="{\"name\":\"$name\",\"gender\":\"$gender\",\"rating\":$rating,\"active\":true,\"is_reserve\":false"
  if [ -n "$ranking" ]; then
    data="$data,\"world_ranking\":$ranking"
  fi
  data="$data}"

  curl -sS -X POST "$PB_URL/api/collections/players/records" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$data"
}

create_reserve_player() {
  local name="$1"
  local gender="$2"
  local rating="$3"

  curl -sS -X POST "$PB_URL/api/collections/players/records" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"name\":\"$name\",\"gender\":\"$gender\",\"rating\":$rating,\"active\":true,\"is_reserve\":true}"
}

create_team() {
  local name="$1"
  local male_id="$2"
  local female_id="$3"

  curl -sS -X POST "$PB_URL/api/collections/teams/records" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"name\":\"$name\",\"malePlayer\":\"$male_id\",\"femalePlayer\":\"$female_id\",\"team_earnings\":0,\"team_points\":0}"
}

echo "Creating 12 pro teams with 24 rostered pros..."
echo ""

team_index=0
for team_name in "${teams[@]}"; do
  male_data="${male_pros[$team_index]}"
  female_data="${female_pros[$team_index]}"

  male_name=$(echo "$male_data" | cut -d: -f1)
  male_rating=$(echo "$male_data" | cut -d: -f2)
  male_rank=$(echo "$male_data" | cut -d: -f3)

  female_name=$(echo "$female_data" | cut -d: -f1)
  female_rating=$(echo "$female_data" | cut -d: -f2)
  female_rank=$(echo "$female_data" | cut -d: -f3)

  male_response=$(create_player "$male_name" "male" "$male_rating" "$male_rank")
  male_id=$(get_id "$male_response")

  female_response=$(create_player "$female_name" "female" "$female_rating" "$female_rank")
  female_id=$(get_id "$female_response")

  team_response=$(create_team "$team_name" "$male_id" "$female_id")
  team_id=$(get_id "$team_response")

  echo "✅ Team $team_name ($team_id)"
  echo "   $male_name (M, rating: $male_rating, rank: #$male_rank)"
  echo "   $female_name (F, rating: $female_rating, rank: #$female_rank)"

  team_index=$((team_index + 1))
done

echo ""
echo "Creating reserve players..."

for reserve_data in "${reserve_males[@]}"; do
  name=$(echo "$reserve_data" | cut -d: -f1)
  rating=$(echo "$reserve_data" | cut -d: -f2)
  create_reserve_player "$name" "male" "$rating" > /dev/null
  echo "✅ Reserve: $name (M, rating: $rating)"
done

for reserve_data in "${reserve_females[@]}"; do
  name=$(echo "$reserve_data" | cut -d: -f1)
  rating=$(echo "$reserve_data" | cut -d: -f2)
  create_reserve_player "$name" "female" "$rating" > /dev/null
  echo "✅ Reserve: $name (F, rating: $rating)"
done

echo ""
echo "🎉 Seed complete: 12 teams, 28 players"
