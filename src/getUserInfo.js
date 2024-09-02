import axios from "axios";

const getUserInfo = async (username) => {
    let responseData;

    await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=82d112e473f59ade0157abe4a47d4eb5&format=json`)
        .then(response => responseData = response.data.user);

    return responseData;
}

export default getUserInfo;