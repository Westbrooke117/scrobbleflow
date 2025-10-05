const truncateText = (text, maxLength = 17) => {
    if (!text) return '';

    const str = String(text);
    if (str.length <= maxLength) {
        return str;
    }

    return str.slice(0, maxLength) + '...';
}

// Used for setting chart data (because for some stupid reason highcharts mutates the state otherwise)
const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
}

const getStartDateFromTimePeriod = (timePeriod) => {
    const timePeriodToDays = {
        "overall" : 0, // Instead use user registration date later
        "lastyear" : 365,
        "6month" : 180,
        "3month" : 90,
        "lastmonth" : 30,
    }

    return (new Date(Date.now() - (timePeriodToDays[timePeriod] * 86400000)))
}

const convertTimePeriodToFullDescription = (timePeriodName) => {
    const timePeriodToFullDescription = {
        "overall" : "All time", // Instead use user registration date later
        "lastyear" : "Last 365 days",
        "6month" : "Last 180 days",
        "3month" : "Last 90 days",
        "lastmonth" : "Last 30 days",
    }

    return timePeriodToFullDescription[timePeriodName]
}

export {truncateText, deepCopy, getStartDateFromTimePeriod, convertTimePeriodToFullDescription}