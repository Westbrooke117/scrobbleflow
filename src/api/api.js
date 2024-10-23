import axios from "axios";

const getUserInfo = async (username) => {
    let responseData;

    await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json`)
        .catch(error => console.log(error)).then(response => responseData = response.data.user);

    return responseData;
}

const getScrobblingDataForAllPeriods = async (username, scrobblingPeriods, category) => {
    let scrobblingData = [];

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

export {getUserInfo, getScrobblingDataForAllPeriods};