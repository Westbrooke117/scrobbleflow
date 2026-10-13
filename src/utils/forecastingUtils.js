const Z_95 = 1.96;
// Periods back at which a period's weight halves. Backtested against linear regression and damped-trend
// exponential smoothing on real last.fm data: a recency-weighted rate was the most accurate overall and
// its ranges matched the 95% target, where the others' were too narrow (linear) or too wide (Holt).
const HALF_LIFE_PERIODS = 20;

/**
 * Forecasts a series from the recent per-period rate, weighting recent periods more heavily.
 * Listening is bursty, so the forecast assumes the recent average rate continues rather than
 * extrapolating a trend from a short binge or slump.
 * @param {number[]} data - The displayed series: cumulative totals or per-period counts.
 * @param {number} historyLookback - Number of periods used to estimate the rate.
 * @param {number} forecastPeriods - Number of periods to forecast forward.
 * @param {boolean} isCumulative - Whether the data is a running total.
 * @returns {object|null} { forecastData: [index, value][], marginOfErrorData: [index, low, high][] },
 * starting at the last real point. The margin is a 95% range.
 */
export const calculateForecast = (data, historyLookback, forecastPeriods = 10, isCumulative = true) => {
    if (!data || data.length < 2) return null;

    const lastIndex = data.length - 1;
    const lastValue = data[lastIndex];
    if (lastValue === null || lastValue === undefined) return null;

    // Work with per-period counts; for cumulative data these are the differences between totals
    const counts = isCumulative ? data.slice(1).map((value, i) => value - data[i]) : data;
    const recent = counts.slice(-historyLookback).filter(value => value !== null && value !== undefined);
    const n = recent.length;
    if (n < 2) return null;

    // Exponentially weighted mean and standard deviation of the recent counts
    const decay = Math.pow(0.5, 1 / HALF_LIFE_PERIODS);
    const weights = recent.map((_, i) => Math.pow(decay, n - 1 - i));
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    const rate = recent.reduce((sum, value, i) => sum + weights[i] * value, 0) / weightSum;
    const effectiveN = (weightSum * weightSum) / weights.reduce((sum, w) => sum + w * w, 0);
    const weightedVariance = recent.reduce((sum, value, i) => sum + weights[i] * (value - rate) ** 2, 0) / weightSum;
    const sigma = Math.sqrt(weightedVariance * effectiveN / Math.max(1, effectiveN - 1));

    const forecastData = [[lastIndex, Math.round(lastValue)]];
    const marginOfErrorData = [[lastIndex, Math.round(lastValue), Math.round(lastValue)]];

    for (let h = 1; h <= forecastPeriods; h++) {
        if (isCumulative) {
            // The total after h periods: noise from each period plus uncertainty in the rate itself
            const total = lastValue + rate * h;
            const margin = Z_95 * sigma * Math.sqrt(h + (h * h) / effectiveN);
            forecastData.push([lastIndex + h, Math.round(total)]);
            marginOfErrorData.push([lastIndex + h, Math.round(Math.max(lastValue, total - margin)), Math.round(total + margin)]);
        } else {
            const margin = Z_95 * sigma * Math.sqrt(1 + 1 / effectiveN);
            forecastData.push([lastIndex + h, Math.round(rate)]);
            marginOfErrorData.push([lastIndex + h, Math.round(Math.max(0, rate - margin)), Math.round(rate + margin)]);
        }
    }

    return { forecastData, marginOfErrorData };
};
