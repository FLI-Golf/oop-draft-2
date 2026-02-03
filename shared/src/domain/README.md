# FLI Golf Domain Models

## League Structure

```
League (1 per season)
├── 12 Teams
│   └── 2 Rostered Players each (1 male + 1 female)
├── 24 Rostered Players (12 male, 12 female)
└── 4 Reserve Players (2 male, 2 female) - NOT on teams
```

**Key points:**
- Results and payouts are **team-based**, not individual
- Each team is a male/female pair
- Reserve players fill in when rostered players are unavailable
- Reserves are NOT assigned to teams

## Fantasy System

```
Fantasy Draft
├── 6 Fantasy Participants
├── 4 Rounds
└── 24 Available Players (from league)
```

**Draft rules:**
- Snake draft order (1-6, 6-1, 1-6, 6-1)
- Each participant drafts 4 players total
- Rounds 1-2: No gender restriction
- Rounds 3-4: Gender composition filter (rules TBD)

## Model Overview

| Model | Purpose |
|-------|---------|
| `Player` | League participant with gender |
| `Team` | 2-player unit (1M + 1F) |
| `League` | 12 teams, 24 players |
| `FantasyParticipant` | Fantasy player who drafts |
| `FantasyDraft` | Draft state and rules |
| `Course` | 9-hole layout with distances |
| `Tournament` | Event on a course |
| `TournamentSettings` | Tee times, format |
| `Group` | Players playing together |
| `TeeTime` | Scheduled start |
| `Round` | Player's 18-hole scores |
| `Score` | Single hole result |
