import { Player } from "./Player";

/**
 * FantasyParticipant represents someone playing in the fantasy draft system.
 * 
 * Fantasy structure:
 * - 6 fantasy participants
 * - Each drafts players from the 24-player pool
 * - 4 rounds of drafting
 * - Rounds 3 and 4 have gender composition requirements
 */
export class FantasyParticipant {
  private readonly _draftedPlayers: Player[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email?: string
  ) {
    if (!id || !name) {
      throw new Error("FantasyParticipant requires id and name");
    }
  }

  /**
   * Players drafted by this participant
   */
  get draftedPlayers(): Player[] {
    return [...this._draftedPlayers];
  }

  /**
   * Male players drafted
   */
  get draftedMales(): Player[] {
    return this._draftedPlayers.filter((p) => p.gender === "male");
  }

  /**
   * Female players drafted
   */
  get draftedFemales(): Player[] {
    return this._draftedPlayers.filter((p) => p.gender === "female");
  }

  /**
   * Add a drafted player (called by FantasyDraft)
   */
  addDraftedPlayer(player: Player): void {
    if (this._draftedPlayers.some((p) => p.id === player.id)) {
      throw new Error(`Player ${player.id} already drafted by ${this.name}`);
    }
    this._draftedPlayers.push(player);
  }

  /**
   * Check if participant has drafted a specific player
   */
  hasDrafted(playerId: string): boolean {
    return this._draftedPlayers.some((p) => p.id === playerId);
  }
}
