import { Group } from "./Group";

/**
 * TeeTime represents a scheduled start time for a group in a tournament.
 */
export class TeeTime {
  constructor(
    public readonly id: string,
    public readonly group: Group,
    public readonly time: string, // HH:MM format
    public readonly startingHole: number = 1
  ) {
    if (!id) {
      throw new Error("TeeTime requires an id");
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error("TeeTime must be in HH:MM format");
    }

    if (startingHole < 1 || startingHole > 9) {
      throw new Error("Starting hole must be between 1 and 9");
    }
  }

  /**
   * Display-friendly time string
   */
  get displayTime(): string {
    const [hours, minutes] = this.time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }
}
