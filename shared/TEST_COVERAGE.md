# Test Coverage: Scoring and Playoffs

This document describes the comprehensive test suite added for scoring and playoff functionality in the FLI Golf League platform.

## Overview

**Total Tests:** 68 passing  
**Test Files:** 5  
**Test Framework:** Vitest 3.2.4

## Test Structure

```
shared/src/domain/__tests__/
├── Score.test.ts                          # 17 tests
├── Group.test.ts                          # 14 tests
├── Tournament.playoff.test.ts             # 15 tests
├── scoring/
│   └── ScoringEngines.test.ts            # 13 tests
└── services/
    └── TournamentService.test.ts         # 9 tests
```

## Test Coverage Details

### 1. Score Model Tests (17 tests)

**File:** `Score.test.ts`

Tests the individual hole scoring logic for players:

- **Constructor validation:**
  - Creates valid scores
  - Rejects invalid stroke counts (< 1 or > 10)
  - Accepts min/max valid strokes (1 and 10)

- **Score calculation (toPar):**
  - Eagle (-2 under par)
  - Birdie (-1 under par)
  - Par (even)
  - Bogey (+1 over par)
  - Double Bogey (+2 over par)

- **Score naming (toParName):**
  - Returns proper names: "Eagle", "Birdie", "Par", "Bogey", "Double Bogey"
  - Returns "+N" format for scores worse than double bogey

### 2. Group Model Tests (14 tests)

**File:** `Group.test.ts`

Tests group creation and validation for both standard and playoff stages:

- **Standard groups:**
  - Must have exactly 2 teams
  - Validates team count constraints

- **Playoff groups:**
  - Can have 2-4 teams (flexible for multi-way playoffs)
  - Supports optional round parameter
  - Validates minimum and maximum team counts

- **Validation:**
  - Requires non-empty id and tournamentId
  - Correct size property calculation

### 3. Scoring Engines Tests (13 tests)

**File:** `scoring/ScoringEngines.test.ts`

Tests the three scoring engine implementations:

#### StandardStrokeEngine (4 tests)
- Correct model name: `standard_match_total_strokes`
- Scores 2-team groups correctly
- Sorts teams by total strokes (lowest wins)
- Validates exactly 2 teams required

#### CTHDistanceEngine (4 tests)
- Correct model name: `playoff_total_distance`
- Scores by closest distance (lowest distance wins)
- Handles 2-4 teams in playoff scenarios
- Validates minimum team count

#### SuddenDeathEngine (5 tests)
- Correct model name: `playoff_sudden_death_hole`
- Sums hole scores for each team
- Handles single hole playoffs
- Handles multiple playoff holes
- Validates minimum team count

### 4. Tournament Playoff Tests (15 tests)

**File:** `Tournament.playoff.test.ts`

Tests tournament playoff detection and workflow:

- **Playoff detection (checkForPlayoff):**
  - Returns null when clear winner exists
  - Detects 2-way ties
  - Detects 3-way ties
  - Handles empty results and single groups

- **Status management:**
  - `requirePlayoff()` - Sets PLAYOFF_REQUIRED status
  - `startPlayoff()` - Sets playoff round and IN_PROGRESS status
  - `finalize()` - Sets winner and FINALIZED status
  - `canFinalize()` - Validates when finalization is allowed

- **Complete workflow integration:**
  - Full playoff flow from tie detection through winner determination
  - Proper status transitions throughout workflow

### 5. TournamentService Tests (9 tests)

**File:** `services/TournamentService.test.ts`

Tests the service layer that orchestrates playoff workflows:

- **completeRegularRound():**
  - Finalizes tournament with clear winner
  - Requires playoff when teams are tied

- **createPlayoffGroup():**
  - Creates playoff group with unique ID
  - Starts playoff and updates tournament status
  - Generates unique IDs for different tournaments

- **checkPlayoffWinner():**
  - Returns winner when one team has lowest score
  - Returns null when teams remain tied
  - Handles 3-way playoffs with clear winner
  - Handles 3-way playoffs where 2 teams remain tied

- **Complete workflow:**
  - Full integration test from regular round completion through playoff resolution
  - Multiple playoff holes if needed
  - Proper status transitions at each step

## Running the Tests

### Run all tests:
```bash
cd shared
pnpm test
```

### Run tests in watch mode:
```bash
cd shared
pnpm test:watch
```

### Run specific test file:
```bash
cd shared
pnpm test Score.test.ts
```

## Test Fixtures

The tests use consistent fixtures to ensure reliability:

- **Players:** Male and female players with PDGA-style ratings
- **Teams:** 2-player teams (1 male, 1 female) following league composition rules
- **Groups:** Standard (2 teams) and playoff (2-4 teams) configurations
- **Tournaments:** With proper season and status tracking

## Coverage Areas

### ✅ Fully Covered

1. **Score calculation logic** - All scoring formulas and display names
2. **Group validation** - Team count constraints for standard and playoff stages
3. **Scoring engines** - All three engine types with various team configurations
4. **Playoff detection** - Tie detection across multiple groups
5. **Playoff workflow** - Complete flow from detection to resolution
6. **Service orchestration** - Tournament service playoff management

### Future Enhancements

The following could be added in future iterations:

1. **Integration tests** - Tests with actual database (PocketBase)
2. **Edge cases** - More complex multi-round playoff scenarios
3. **Performance tests** - Large tournament simulations
4. **Error recovery** - Tests for partial data or network failures

## Related Database Schema

The tests validate business logic for these PocketBase collections:

- `scores` - Individual hole scores (migration: 1770400000_scoring.js)
- `playoffs` - Playoff rounds (migration: 1770500000_playoffs.js)
- `playoff_teams` - Teams in playoffs
- `playoff_throws` - Closest-to-hole throws

## Test Quality Metrics

- **Pass Rate:** 100% (68/68 tests passing)
- **Execution Time:** Fast (~1 second total)
- **Test Organization:** Well-structured with descriptive names
- **Test Isolation:** Each test is independent and can run in any order
- **Fixture Reuse:** Common fixtures minimize code duplication

## Maintenance Notes

- Tests use TypeScript for type safety
- Vitest provides fast execution and excellent error messages
- Test fixtures create realistic golf league scenarios
- All validation rules match domain model constraints
