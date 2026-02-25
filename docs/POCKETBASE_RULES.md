# PocketBase Collection Rules

Access rules for each collection. Empty string (`""`) means the action is allowed for everyone (including unauthenticated users). `null` means only superusers can perform the action.

> These rules reflect the current prototype state. Most collections are wide open for development speed. Production rules should restrict write access by role.

---

## Collections

### users (auth collection)

Authenticated users can only access their own record.

| Action | Rule |
|--------|------|
| List | `id = @request.auth.id` |
| View | `id = @request.auth.id` |
| Create | `""` (open — allows self-registration) |
| Update | `id = @request.auth.id` |
| Delete | `id = @request.auth.id` |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | email | yes | Unique |
| name | text | no | Display name |
| role | select | yes | Values: `Admin`, `Scorekeeper`, `Pro`, `Basic User` |
| avatar | file | no | Profile image |
| emailVisibility | bool | no | |
| verified | bool | no | |

---

### courses

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text | yes | Max 120 chars |
| baseHoleDistances | json | yes | Array of 9 distances (feet) |

---

### seasons

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| year | text | yes | e.g., `"2026"` |
| active | bool | no | Whether this is the current season |

---

### tournaments

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| name | text | yes | |
| date | date | yes | |
| course | relation | yes | → `courses` (single) |
| seasonId | relation | yes | → `seasons` (single) |

---

### tournament_settings

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tournament | relation | no | → `tournaments` (single) |
| startingHole | number | yes | |
| intervalMinutes | number | yes | Minutes between tee times |
| firstTeeTime | text | yes | e.g., `"08:00"` |
| format | select | yes | Values: `stroke`, etc. |
| groupSize | number | no | |
| scoringModel | select | no | |

---

### players

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text | yes | |
| gender | select | yes | Values: `male`, `female` |
| rating | number | no | PDGA-style rating |
| world_ranking | number | no | |
| active | bool | no | |
| is_reserve | bool | no | Reserve players are not on a team |
| email | email | no | |

---

### teams

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| name | text | yes | |
| malePlayer | relation | yes | → `players` (single) |
| femalePlayer | relation | yes | → `players` (single) |
| team_earnings | number | no | Cumulative prize money |
| team_points | number | no | Season points |

---

### groups

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation / Notes |
|-------|------|----------|------------------|
| tournament | relation | yes | → `tournaments` (single) |
| team1 | relation | yes | → `teams` (single) |
| team2 | relation | yes | → `teams` (single) |
| teeTime | text | no | e.g., `"08:00"` |
| startingHole | number | no | |
| groupNumber | number | no | |
| status | select | no | Group play status |
| stage | select | no | e.g., regular, playoff |

---

### scores

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| group | relation | yes | → `groups` (single) |
| player | relation | yes | → `players` (single) |
| hole | number | yes | Hole number (1-9) |
| score | number | yes | Strokes or distance |

---

### season_settings

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| season | select | yes | Season identifier |
| prizePool | number | yes | Total prize pool amount |
| distributed | bool | no | Whether prizes have been paid out |

---

### prize_distributions

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| tournament | relation | yes | → `tournaments` (single) |
| team | relation | yes | → `teams` (single) |
| position | number | yes | Finishing position |
| prizeAmount | number | yes | |
| season | text | yes | |

---

### playoffs

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation / Notes |
|-------|------|----------|------------------|
| tournament | relation | yes | → `tournaments` (single) |
| playoffRound | number | yes | Round number (1, 2, ...) |
| forPosition | number | yes | Which position this playoff decides |
| status | select | no | |
| winner | relation | no | → `teams` (single) |

---

### playoff_teams

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| playoff | relation | yes | → `playoffs` (single) |
| team | relation | yes | → `teams` (single) |
| tiedScore | number | yes | Score that caused the tie |

---

### playoff_throws

| Action | Rule |
|--------|------|
| List | `""` (public) |
| View | `""` (public) |
| Create | `""` (open) |
| Update | `""` (open) |
| Delete | `""` (open) |

**Fields:**

| Field | Type | Required | Relation |
|-------|------|----------|----------|
| playoff | relation | yes | → `playoffs` (single) |
| team | relation | yes | → `teams` (single) |
| player | relation | yes | → `players` (single) |
| distanceFeet | number | yes | Closest-to-hole distance |
| throwOrder | number | yes | Order of throw in the round |

---

## Recommended Production Rules

The current rules are wide open for prototyping. For production, consider:

| Collection | List/View | Create | Update | Delete |
|------------|-----------|--------|--------|--------|
| users | Own record only | Open (self-registration) | Own record only | Own record only |
| courses | Public | Admin only | Admin only | Admin only |
| seasons | Public | Admin only | Admin only | Admin only |
| tournaments | Public | Admin only | Admin only | Admin only |
| tournament_settings | Public | Admin only | Admin only | Admin only |
| players | Public | Admin only | Admin only | Admin only |
| teams | Public | Admin only | Admin only | Admin only |
| groups | Public | Admin only | Admin + Scorekeeper | Admin only |
| scores | Public | Admin + Scorekeeper | Admin + Scorekeeper | Admin only |
| playoffs | Public | Admin only | Admin only | Admin only |
| playoff_teams | Public | Admin only | Admin only | Admin only |
| playoff_throws | Public | Admin + Scorekeeper | Admin + Scorekeeper | Admin only |
| season_settings | Public | Admin only | Admin only | Admin only |
| prize_distributions | Public | Admin only | Admin only | Admin only |

Example rule for "Admin only" create:

```
@request.auth.id != "" && @request.auth.role = "Admin"
```

Example rule for "Admin + Scorekeeper" create:

```
@request.auth.id != "" && (@request.auth.role = "Admin" || @request.auth.role = "Scorekeeper")
```

## Entity Relationship Summary

```
seasons ──< tournaments ──< groups ──< scores
                │              │
                │              ├── team1 ──> teams ──> players (male)
                │              └── team2 ──> teams ──> players (female)
                │
                ├──> courses
                │
                ├──< tournament_settings
                │
                ├──< prize_distributions ──> teams
                │
                └──< playoffs ──< playoff_teams ──> teams
                          └──< playoff_throws ──> teams, players
```
