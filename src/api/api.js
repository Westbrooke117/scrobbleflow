import axios from "axios";

const getUserInfo = async (username) => {
    let responseData;

    // Get user info for username, profile picture, and account registration date
    await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json`)
        .catch(error => alert(`Error! Please try again in 15 seconds\n\nNote: If you are getting an error consistently it's likely due to you having too many tracks/artists/albums. Please select a smaller time period on the start page and try again.\n\nError log: ${error}`))
        .then(response => responseData = response.data.user);

    return responseData;
}

const getScrobblingDataForAllPeriods = async (username, scrobblingPeriods, category, onProgress) => {
    let completedRequests = 0;
    const totalRequests = scrobblingPeriods.length;

    // Helper to send request and track progress
    const fetchPeriod = async (scrobblingPeriod) => {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=user.getweekly${category}chart&user=${username}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json&from=${scrobblingPeriod.fromUnix}&to=${scrobblingPeriod.toUnix}`;
            const response = await axios.get(url);
            const data = response.data[`weekly${category}chart`][category];

            // Return data if it exists, otherwise returning empty array to maintain alignment
            return (data && data.length > 0) ? data : [];
        } catch (error) {
            console.error(`Error fetching period: ${error}`);
            return []; // Return empty array on error to maintain alignment
        } finally {
            completedRequests++;
            if (onProgress) {
                onProgress(Math.round((completedRequests / totalRequests) * 100));
            }
        }
    };

    // Execute all requests
    const scrobblingData = await Promise.all(scrobblingPeriods.map(period => fetchPeriod(period)));

    return scrobblingData;
}

export { getUserInfo, getScrobblingDataForAllPeriods };