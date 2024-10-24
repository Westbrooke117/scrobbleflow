
const smoothDataset = ([...dataset], smoothStrength) => {
    let smoothedData = []

    for (let i = smoothStrength; i < dataset.length - smoothStrength; i++){
        switch (smoothStrength){
            case 1:
                smoothedData.push(
                    Math.round((dataset[i-1] + dataset[i] + dataset[i+1])/3)
                )
                break;
            case 2:
                smoothedData.push(
                    Math.round((dataset[i-2] + dataset[i-1] + dataset[i] + dataset[i+1] + dataset[i+2])/5)
                )
                break;
            case 3:
                smoothedData.push(
                    Math.round((dataset[i-3] + dataset[i-2] + dataset[i-1] + dataset[i] + dataset[i+1] + dataset[i+2] + dataset[i+3])/7)
                )
                break;
        }
    }
    return smoothedData
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
        if (dataset[i] !== 0){
            alignedDataset.push(dataset[i])
        }
    }

    return alignedDataset
}

export {smoothDataset, getSmoothStrengthLabel, sortArrayByTotalScrobbles, calculateAlignedDataset}