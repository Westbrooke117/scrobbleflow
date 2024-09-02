import axios from "axios";

const getScrobblingDataForAllPeriods = async (username, scrobblingPeriods) => {
    let scrobblingData = [];

    const category = 'artist'

    //Generate array of API requests
    let scrobblingPeriodRequests = [];

    scrobblingPeriods.map(scrobblingPeriod => {
        scrobblingPeriodRequests.push(`https://ws.audioscrobbler.com/2.0/?method=user.getweekly${category}chart&user=${username}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json&from=${scrobblingPeriod.fromUnix}&to=${scrobblingPeriod.toUnix}`);
    })

    await axios.all(scrobblingPeriodRequests.map(period => axios.get(period)))
        .then(axios.spread((...response) => {
            response.map(period => {
                scrobblingData.push(period.data[`weekly${category}chart`][category])
            })
        }))

    return scrobblingData;
}

export {getScrobblingDataForAllPeriods}