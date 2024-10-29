import axios from "axios";

const getUserInfo = async (username) => {
    let responseData;

    // Get user info for username, profile picture, and account registration date
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

    // Send all API requests
    // Note: Sometimes this overloads the API
    await axios.all(scrobblingPeriodRequests.map(period => axios.get(period)))
        .then(axios.spread((...response) => {
            response.forEach(period => {
                const data = period.data[`weekly${category}chart`][category];
                if (data && data.length > 0) {
                    scrobblingData.push(data);
                }
            });
        }));

    return scrobblingData;
}

export {getUserInfo, getScrobblingDataForAllPeriods};