export class Hole {
    number;
    distance;
    par = 3;
    constructor(number, distance) {
        this.number = number;
        this.distance = distance;
        if (distance < 200 || distance > 400) {
            throw new Error(`Hole ${number} distance must be between 200–400 feet`);
        }
    }
}
