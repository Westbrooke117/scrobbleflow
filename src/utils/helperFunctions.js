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

const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

// Long form for tooltips, e.g. "12 days", "5 months", "2.5 years"
const formatTimeSinceFirstScrobble = (elapsedMs) => {
    const days = Math.round(elapsedMs / MS_PER_DAY);
    if (days < 60) return `${days} ${days === 1 ? 'day' : 'days'}`;

    const months = Math.round(days / DAYS_PER_MONTH);
    if (months < 24) return `${months} months`;

    return `${Math.round(days / DAYS_PER_YEAR * 10) / 10} years`;
}

// Short form for axis labels, e.g. "12d", "5mo", "2.5y". The unit is picked from the visible
// axis span so every label on the axis uses the same unit
const formatElapsedAxisLabel = (elapsedMs, axisSpanMs) => {
    const days = elapsedMs / MS_PER_DAY;
    const spanDays = axisSpanMs / MS_PER_DAY;

    if (elapsedMs === 0) return '0';
    if (spanDays <= 120) return `${Math.round(days)}d`;
    if (spanDays <= 3 * DAYS_PER_YEAR) return `${Math.round(days / DAYS_PER_MONTH)}mo`;
    return `${Math.round(days / DAYS_PER_YEAR * 10) / 10}y`;
}

export {truncateText, deepCopy, getStartDateFromTimePeriod, convertTimePeriodToFullDescription, formatTimeSinceFirstScrobble, formatElapsedAxisLabel}