import { Player, Gender } from "./Player";
import { FantasyParticipant } from "./FantasyParticipant";

/**
 * FantasyDraft manages the fantasy draft process.
 * 
 * Draft structure:
 * - 6 fantasy participants
 * - 24 players available (12 male, 12 female)
 * - 4 rounds of drafting
 * - Each participant drafts 4 players total (1 per round)
 * 
 * Gender composition rules:
 * - Rounds 1-2: No gender restriction (any player)
 * - Rounds 3-4: Gender filter applied (details TBD by league rules)
 * 
 * Draft order:
 * - Snake draft format (1-6, 6-1, 1-6, 6-1)
 */
export class FantasyDraft {
  static readonly PARTICIPANT_COUNT = 6;
  static readonly ROUND_COUNT = 4;
  static readonly PLAYERS_PER_PARTICIPANT = 4;

  private readonly picks: DraftPick[] = [];
  private _currentRound = 1;
  private _currentPickIndex = 0;

  constructor(
    public readonly id: string,
    public readonly season: string,
    public readonly participants: FantasyParticipant[],
    public readonly availablePlayers: Player[]
  ) {
    if (!id || !season) {
      throw new Error("FantasyDraft requires id and season");
    }

    if (participants.length !== FantasyDraft.PARTICIPANT_COUNT) {
      throw new Error(`Fantasy draft requires exactly ${FantasyDraft.PARTICIPANT_COUNT} participants`);
    }

    if (availablePlayers.length !== 24) {
      throw new Error("Fantasy draft requires exactly 24 available players");
    }

    const males = availablePlayers.filter((p) => p.gender === "male");
    const females = availablePlayers.filter((p) => p.gender === "female");

    if (males.length !== 12 || females.length !== 12) {
      throw new Error("Fantasy draft requires 12 male and 12 female players");
    }
  }

  get currentRound(): number {
    return this._currentRound;
  }

  get currentPickIndex(): number {
    return this._currentPickIndex;
  }

  /**
   * Get the participant who picks next
   */
  get currentPicker(): FantasyParticipant | null {
    if (this.isComplete) return null;
    return this.getPickerForPosition(this._currentRound, this._currentPickIndex);
  }

  /**
   * Snake draft order: odd rounds go 0-5, even rounds go 5-0
   */
  private getPickerForPosition(round: number, pickIndex: number): FantasyParticipant {
    const isEvenRound = round % 2 === 0;
    const index = isEvenRound
      ? FantasyDraft.PARTICIPANT_COUNT - 1 - pickIndex
      : pickIndex;
    return this.participants[index];
  }

  /**
   * Players still available to draft
   */
  get remainingPlayers(): Player[] {
    const draftedIds = new Set(this.picks.map((p) => p.player.id));
    return this.availablePlayers.filter((p) => !draftedIds.has(p.id));
  }

  /**
   * Players available for current pick (applies gender filter for rounds 3-4)
   */
  get eligiblePlayers(): Player[] {
    const remaining = this.remainingPlayers;
    const genderFilter = this.getGenderFilterForRound(this._currentRound);

    if (!genderFilter) {
      return remaining;
    }

    return remaining.filter((p) => p.gender === genderFilter);
  }

  /**
   * Gender filter for a given round.
   * Rounds 1-2: null (no filter)
   * Rounds 3-4: Returns required gender based on league rules
   * 
   * TODO: Implement specific gender composition rules when provided
   */
  getGenderFilterForRound(round: number): Gender | null {
    if (round <= 2) {
      return null; // No restriction
    }

    // Rounds 3-4 have gender composition requirements
    // Placeholder: alternate male/female in later rounds
    // Update this when specific rules are defined
    return round === 3 ? "male" : "female";
  }

  /**
   * Whether the draft is complete
   */
  get isComplete(): boolean {
    return this.picks.length >= FantasyDraft.PARTICIPANT_COUNT * FantasyDraft.ROUND_COUNT;
  }

  /**
   * Make a draft pick
   */
  pick(participantId: string, playerId: string): DraftPick {
    if (this.isComplete) {
      throw new Error("Draft is complete");
    }

    const picker = this.currentPicker;
    if (!picker || picker.id !== participantId) {
      throw new Error(`It is not ${participantId}'s turn to pick`);
    }

    const player = this.eligiblePlayers.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} is not eligible for this pick`);
    }

    const pick: DraftPick = {
      round: this._currentRound,
      pickNumber: this.picks.length + 1,
      participant: picker,
      player
    };

    this.picks.push(pick);
    picker.addDraftedPlayer(player);

    // Advance to next pick
    this._currentPickIndex++;
    if (this._currentPickIndex >= FantasyDraft.PARTICIPANT_COUNT) {
      this._currentPickIndex = 0;
      this._currentRound++;
    }

    return pick;
  }

  /**
   * Get all picks made so far
   */
  get allPicks(): DraftPick[] {
    return [...this.picks];
  }

  /**
   * Get picks for a specific round
   */
  getPicksForRound(round: number): DraftPick[] {
    return this.picks.filter((p) => p.round === round);
  }

  /**
   * Get picks for a specific participant
   */
  getPicksForParticipant(participantId: string): DraftPick[] {
    return this.picks.filter((p) => p.participant.id === participantId);
  }
}

/**
 * A single draft pick
 */
export interface DraftPick {
  round: number;
  pickNumber: number;
  participant: FantasyParticipant;
  player: Player;
}
