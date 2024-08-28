import axios from "axios";

const getScrobblingDataForAllPeriods = async (scrobblingPeriods) => {
    let scrobblingData = [];

    //Generate array of API requests
    let scrobblingPeriodRequests = [];

    scrobblingPeriods.map(scrobblingPeriod => {
        scrobblingPeriodRequests.push(`https://ws.audioscrobbler.com/2.0/?method=user.getweeklyartistchart&user=westbrooke117&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json&from=${scrobblingPeriod.fromUnix}&to=${scrobblingPeriod.toUnix}`);
    })

    await axios.all(scrobblingPeriodRequests.map(period => axios.get(period)))
        .then(axios.spread((...response) => {
            response.map(period => {
                scrobblingData.push(period.data.weeklyartistchart.artist)
            })
        }))

    return scrobblingData;
}

export {getScrobblingDataForAllPeriods}