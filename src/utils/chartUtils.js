
// Centred moving average. Output has the same length as the input so it stays aligned with pointStart;
// at the edges the window shrinks to the points available. Null values (e.g. unranked periods) are skipped.
const smoothDataset = (dataset, smoothStrength) => {
    if (smoothStrength <= 0) return dataset;

    const smoothedData = new Array(dataset.length);

    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i] === null || dataset[i] === undefined) {
            smoothedData[i] = dataset[i];
            continue;
        }

        let sum = 0;
        let count = 0;
        const windowEnd = Math.min(dataset.length - 1, i + smoothStrength);
        for (let j = Math.max(0, i - smoothStrength); j <= windowEnd; j++) {
            if (dataset[j] !== null && dataset[j] !== undefined) {
                sum += dataset[j];
                count++;
            }
        }

        smoothedData[i] = Math.round(sum / count);
    }
    return smoothedData;
}

// Shown as label above smooth strength slider
const getSmoothStrengthLabel = (smoothStrength) => {
    const labels = [
        'No smoothing (real data)',
        '3-point smoothing',
        '5-point smoothing',
        '7-point smoothing'
    ]
    return labels[smoothStrength]
}

// Returns dataset aligned to the first scrobble: periods before firstScrobbleIndex are dropped
// (later zero periods are kept) and leadingValue is prepended as the starting point
const calculateAlignedDataset = (dataset, firstScrobbleIndex, leadingValue = 0) => {
    if (firstScrobbleIndex < 0) return [leadingValue];
    return [leadingValue, ...dataset.slice(firstScrobbleIndex)];
}

const chartSeriesColours = ["#2caffe", "#544fc5", "#00e272", "#fe6a35", "#6b8abc", "#d568fb", "#2ee0ca", "#fa4b42", "#feb56a", "#91e8e1"];

export { smoothDataset, getSmoothStrengthLabel, calculateAlignedDataset, chartSeriesColours }
