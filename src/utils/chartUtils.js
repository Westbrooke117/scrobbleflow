
const smoothDataset = (dataset, smoothStrength) => {
    if (smoothStrength <= 0) return dataset;

    const windowSize = 2 * smoothStrength + 1;
    let smoothedData = [];

    for (let i = smoothStrength; i < dataset.length - smoothStrength; i++) {
        const sum = dataset
            .slice(i - smoothStrength, i + smoothStrength + 1)
            .reduce((acc, val) => acc + val, 0);

        smoothedData.push(Math.round(sum / windowSize));
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

const sortArrayByTotalScrobbles = (array) => {
    return array.sort((a, b) => b.totalScrobbles - a.totalScrobbles);
}

// Returns dataset with all items aligned to the first scrobble
const calculateAlignedDataset = ([...dataset]) => {
    let alignedDataset = []

    alignedDataset.push(0)
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i] !== 0) {
            alignedDataset.push(dataset[i])
        }
    }

    return alignedDataset
}

const chartSeriesColours = ["#2caffe", "#544fc5", "#00e272", "#fe6a35", "#6b8abc", "#d568fb", "#2ee0ca", "#fa4b42", "#feb56a", "#91e8e1"];

export { smoothDataset, getSmoothStrengthLabel, sortArrayByTotalScrobbles, calculateAlignedDataset, chartSeriesColours }
