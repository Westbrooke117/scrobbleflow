/**
 * Calculates a linear regression forecast based on history.
 * @param {number[]} data - The historical data series.
 * @param {number} historyLookback - Number of periods to look back for the trend.
 * @param {number} forecastPeriods - Number of periods to forecast forward.
 * @param {boolean} isCumulative - Whether the data is cumulative (non-decreasing).
 * @returns {object|null} { forecastData, marginOfErrorData }
 */
export const calculateForecast = (data, historyLookback, forecastPeriods = 10, isCumulative = true) => {
    if (!data || data.length < 2) return null;

    // Filter out null/undefined values and keep their indices
    const validPoints = data
        .map((y, x) => ({ x, y }))
        .filter(point => point.y !== null && point.y !== undefined);

    if (validPoints.length < 2) return null;

    const actualLookback = Math.min(historyLookback, validPoints.length);
    const subset = validPoints.slice(-actualLookback);

    const n = subset.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        const x = i; // We use relative X for the internal regression
        const y = subset[i].y;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null; // Parallel to Y axis or single point

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error
    let sumSquaredResiduals = 0;
    for (let i = 0; i < n; i++) {
        const x = i;
        const y = subset[i].y;
        const predictedY = slope * x + intercept;
        sumSquaredResiduals += Math.pow(y - predictedY, 2);
    }

    const standardError = Math.sqrt(sumSquaredResiduals / (n - 2 || 1));

    const forecastData = [];
    const marginOfErrorData = [];

    const lastRealIndex = data.length - 1;
    const lastRealValue = data[lastRealIndex] !== null ? data[lastRealIndex] : subset[subset.length - 1].y;

    // Add the starting point for the forecast line (connects to the last real data point)
    forecastData.push([lastRealIndex, Math.round(lastRealValue)]);
    marginOfErrorData.push([lastRealIndex, Math.round(lastRealValue), Math.round(lastRealValue)]);

    let currentForecastY = lastRealValue;

    // The internal regression was performed on relative indices [0...n-1]
    // The last point of the subset corresponded to relative X = n-1.
    // So the next point (forecast) starts at relative X = n, n+1, etc.
    for (let i = 1; i <= forecastPeriods; i++) {
        const relativeX = (n - 1) + i;

        // We project from the last real value using the slope
        let predictedY = lastRealValue + (slope * i);

        if (isCumulative) {
            predictedY = Math.max(currentForecastY, predictedY);
            currentForecastY = predictedY;
        } else {
            predictedY = Math.max(0, predictedY);
        }

        // Standard error of the prediction (includes uncertainty of slope and intercept)
        const errorTerm = standardError * Math.sqrt(1 + 1 / n + Math.pow(relativeX - (sumX / n), 2) / denominator);
        const cappedError = isFinite(errorTerm) ? errorTerm : 0;

        const finalY = Math.round(predictedY);
        const low = Math.round(Math.max(0, predictedY - cappedError * 2));
        const high = Math.round(predictedY + cappedError * 2);

        forecastData.push([lastRealIndex + i, finalY]);
        marginOfErrorData.push([lastRealIndex + i, low, high]);
    }

    return { forecastData, marginOfErrorData };
};
