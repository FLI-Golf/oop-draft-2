export var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["SETUP"] = "SETUP";
    TournamentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TournamentStatus["COMPLETED"] = "COMPLETED";
    TournamentStatus["PLAYOFF_REQUIRED"] = "PLAYOFF_REQUIRED";
    TournamentStatus["PLAYOFF_IN_PROGRESS"] = "PLAYOFF_IN_PROGRESS";
    TournamentStatus["FINALIZED"] = "FINALIZED";
})(TournamentStatus || (TournamentStatus = {}));
export class Tournament {
    id;
    name;
    date;
    season;
    status = TournamentStatus.SETUP;
    playoffRound; // groupId of playoff round
    winner; // teamId of tournament winner
    constructor(id, name, date, season) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.season = season;
    }
    // Check if tournament results show a tie for first place
    checkForPlayoff(results) {
        if (results.length === 0)
            return null;
        // Get all team scores across all groups
        const allTeamScores = new Map();
        results.forEach(group => {
            group.results.forEach(teamResult => {
                const currentScore = allTeamScores.get(teamResult.teamId) || 0;
                allTeamScores.set(teamResult.teamId, currentScore + teamResult.value);
            });
        });
        // Find winning score (lowest for stroke play)
        const scores = Array.from(allTeamScores.entries());
        scores.sort((a, b) => a[1] - b[1]);
        if (scores.length === 0)
            return null;
        const winningScore = scores[0][1];
        const tiedTeams = scores
            .filter(([_, score]) => score === winningScore)
            .map(([teamId, _]) => teamId);
        // Playoff needed if more than 1 team has winning score
        return tiedTeams.length > 1 ? tiedTeams : null;
    }
    // Mark that playoff is required
    requirePlayoff(tiedTeamIds) {
        this.status = TournamentStatus.PLAYOFF_REQUIRED;
        console.log(`Playoff required for teams: ${tiedTeamIds.join(', ')}`);
    }
    // Start playoff round
    startPlayoff(playoffGroupId) {
        this.playoffRound = playoffGroupId;
        this.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
    }
    // Finalize tournament with winner
    finalize(winnerId) {
        this.winner = winnerId;
        this.status = TournamentStatus.FINALIZED;
    }
    // Check if tournament can be finalized
    canFinalize() {
        return this.status === TournamentStatus.COMPLETED ||
            this.status === TournamentStatus.PLAYOFF_IN_PROGRESS;
    }
}
