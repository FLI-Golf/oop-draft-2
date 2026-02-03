#!/usr/bin/env bash
set -euo pipefail

# FLI Golf Pro Teams Seed Script
# Creates 12 pro teams with real PDGA pros + 4 reserve players (not on teams)

PB_URL="${PB_URL:-http://127.0.0.1:8090}"

echo "Seeding FLI Golf pros and teams..."
echo "PocketBase URL: $PB_URL"
echo ""

# 12 team names
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

# Male pros (real PDGA pros with ratings and world rankings)
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

# Female pros (real PDGA pros with ratings and world rankings)
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

# Reserve players (not assigned to teams, fill in when needed)
reserve_males=(
  "Aaron Gossage:985"
  "Corey Ellis:980"
)

reserve_females=(
  "Valerie Mandujano:940"
  "Rebecca Cox:935"
)

# Helper to extract ID from JSON response
get_id() {
  echo "$1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Create a rostered player (on a team)
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
  
  curl -s -X POST "$PB_URL/api/collections/players/records" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Create a reserve player (not on a team, fills in when needed)
create_reserve_player() {
  local name="$1"
  local gender="$2"
  local rating="$3"
  
  curl -s -X POST "$PB_URL/api/collections/players/records" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"gender\":\"$gender\",\"rating\":$rating,\"active\":true,\"is_reserve\":true}"
}

# Create a team
create_team() {
  local name="$1"
  local male_id="$2"
  local female_id="$3"
  
  curl -s -X POST "$PB_URL/api/collections/teams/records" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"malePlayer\":\"$male_id\",\"femalePlayer\":\"$female_id\",\"team_earnings\":0,\"team_points\":0}"
}

echo "Creating 12 pro teams with 24 rostered pros..."
echo ""

team_index=0
for team_name in "${teams[@]}"; do
  # Get male and female pro data
  male_data="${male_pros[$team_index]}"
  female_data="${female_pros[$team_index]}"
  
  # Parse male pro
  male_name=$(echo "$male_data" | cut -d: -f1)
  male_rating=$(echo "$male_data" | cut -d: -f2)
  male_rank=$(echo "$male_data" | cut -d: -f3)
  
  # Parse female pro
  female_name=$(echo "$female_data" | cut -d: -f1)
  female_rating=$(echo "$female_data" | cut -d: -f2)
  female_rank=$(echo "$female_data" | cut -d: -f3)
  
  # Create players
  male_response=$(create_player "$male_name" "male" "$male_rating" "$male_rank")
  male_id=$(get_id "$male_response")
  
  female_response=$(create_player "$female_name" "female" "$female_rating" "$female_rank")
  female_id=$(get_id "$female_response")
  
  # Create team
  team_response=$(create_team "$team_name" "$male_id" "$female_id")
  team_id=$(get_id "$team_response")
  
  echo "✅ Team $team_name ($team_id)"
  echo "   $male_name (M, rating: $male_rating, rank: #$male_rank)"
  echo "   $female_name (F, rating: $female_rating, rank: #$female_rank)"
  
  team_index=$((team_index + 1))
done

echo ""
echo "Creating reserve players (not on teams, fill in when needed)..."

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
echo "🎉 Seed complete:"
echo "   - 12 Pro Teams (24 rostered pros: 12 male, 12 female)"
echo "   - 4 Reserve Players (2 male, 2 female) - not on teams"
echo "   - Total: 12 teams, 28 players"
