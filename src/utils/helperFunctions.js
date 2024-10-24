// Used in chart tooltip to maintain consistent tooltip width and in series entries tags
const truncateText = (text, textCutoff=17) => {
    return text.length > textCutoff ? text.substring(0, textCutoff) + "..." : text
}

// Used for setting chart data (because for some stupid reason highcharts mutates the state otherwise)
const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
}

export {truncateText, deepCopy}