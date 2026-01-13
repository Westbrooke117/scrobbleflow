export class ScrobbleItem {
    constructor(name, artist = null) {
        this.name = name;
        this.artist = artist;
        this.totalScrobbles = 0;
        this.cumulativeScrobbleData = [];
        this.noncumulativeScrobbleData = [];
        this.periodRankingPositions = [];
    }

    // Optimization: These methods can be removed if we populate the data more efficiently during the main loop,
    // but I'll keep them for now and refactor the main loop to not use them as much, or use them more efficiently.

    calculateTotalScrobbles(scrobblingData) {
        let runningTotal = 0;

        scrobblingData.forEach(period => {
            period.forEach(item => {
                if (item.name === this.name) {
                    runningTotal += parseInt(item.playcount)
                }
            })
        })
        this.totalScrobbles = runningTotal;
    }

    calculateLongitudinalData(scrobblingData) {
        let cumulativeScrobbleData = [];
        let runningTotal = 0;
        let noncumulativeScrobbleData = [];
        let periodRankingPositions = [];

        scrobblingData.forEach(period => {
            let item = period.find(item => item.name === this.name)

            if (item !== undefined) {
                const playcount = parseInt(item.playcount) || 0;
                runningTotal += playcount;
                cumulativeScrobbleData.push(runningTotal);
                noncumulativeScrobbleData.push(playcount)
                periodRankingPositions.push(parseInt(item["@attr"]?.rank) - 1);
            } else {
                cumulativeScrobbleData.push(runningTotal);
                noncumulativeScrobbleData.push(0)
                periodRankingPositions.push(null);
            }
        })

        this.cumulativeScrobbleData = cumulativeScrobbleData;
        this.noncumulativeScrobbleData = noncumulativeScrobbleData;
        this.periodRankingPositions = periodRankingPositions;
    }
}
