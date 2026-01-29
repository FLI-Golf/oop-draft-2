export class Hole {
  public readonly par = 3;

  constructor(
    public readonly number: number,
    public readonly distance: number
  ) {
    if (distance < 200 || distance > 400) {
      throw new Error(`Hole ${number} distance must be between 200–400 feet`);
    }
  }
}
