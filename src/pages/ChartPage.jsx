import '../App.css'
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getScrobblingDataForAllPeriods, getUserInfo } from "../api/api.js";
import { AnimatePresence, motion } from "framer-motion";
import Highcharts from 'highcharts/highstock'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsExporting from 'highcharts/modules/exporting'
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting'
import HighchartsReact from "highcharts-react-official";
import { calculateForecast } from "../utils/forecastingUtils.js";
import { exportChartAsCsv, exportChartAsImage } from "../utils/exportUtils.js";
HighchartsMore(Highcharts)
HighchartsExporting(Highcharts)
HighchartsOfflineExporting(Highcharts)
import {
    HStack,
    Text,
    Box,
    Container,
    Grid,
    GridItem,
    Fade,
    Progress,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { CustomDivider } from "../components/CustomDivider.jsx";
import {
    formatElapsedAxisLabel,
    formatDuration,
    getStartDateFromTimePeriod,
    truncateText
} from "../utils/helperFunctions.js";
import { HeaderBar } from "../components/HeaderBar.jsx";
import { UserInfoAccordion } from "../components/UserInfoAccordion.jsx";
import {
    calculateAlignedDataset,
    smoothDataset,
    chartSeriesColours
} from "../utils/chartUtils.js";
import { getStoredSetting, saveToLocalStorage } from "../utils/localStorageManager.js";
import { ScrobbleItem } from "../utils/ScrobbleItem.js";

// Extracted Components
import { ChartSettings } from "../components/ChartPage/ChartSettings.jsx";
import { VisualificationOptions as VisualisationOptions } from "../components/ChartPage/VisualisationOptions.jsx";
import { ForecastingOptions } from "../components/ChartPage/ForecastingOptions.jsx";
import { MiscellaneousOptions } from "../components/ChartPage/MiscellaneousOptions.jsx";
import { SeriesEntriesSearch } from "../components/ChartPage/SeriesEntriesSearch.jsx";
import { ExportOptions } from "../components/ChartPage/ExportOptions.jsx";


const baseChartOptions = {
    chart: {
        backgroundColor: '#1a202c',
    },
    navigator: {
        outlineColor: '#3f444e',
        series: {
            color: '#90cdf4',
            lineColor: '#90cdf4'
        },
        xAxis: {
            gridLineColor: '#3f444e',
            labels: {
                style: {
                    color: '#b1b1b1'
                }
            }
        },
        handles: {
            backgroundColor: '#3f444e',
            borderColor: '#90cdf4'
        }
    },
    scrollbar: {
        barBackgroundColor: '#2c323d',
        trackBackgroundColor: '#171923',
        trackBorderColor: '#171923',
        buttonBackgroundColor: '#2c323d',
        buttonBorderColor: '#3f444e',
        buttonArrowColor: '#b1b1b1',
        rifleColor: '#b1b1b1',
        height: 5
    },
    plotOptions: {
        line: {
            marker: {
                enabled: false
            }
        },
        column: {
            borderWidth: 0
        },
        spline: {
            marker: {
                enabled: false
            }
        },
        area: {
            marker: {
                enabled: false
            }
        }
    },
    rangeSelector: {
        buttonTheme: {
            fill: '#2c323d',
            r: 5,
            width: 30,
            style: {
                color: 'white',
                fontWeight: 'bold',
            },
            states: {
                hover: {
                    fill: '#3f444e',
                    style: {
                        color: 'white'
                    }
                },
                select: {
                    fill: '#90cdf4',
                    style: {
                        color: '#171923'
                    }
                }
            }
        },
        labelStyle: {
            color: '#b1b1b1',
            fontWeight: 'bold'
        },
        inputStyle: {
            color: '#b1b1b1'
        }
    },
    legend: {
        itemStyle: { 'color': '#eeefef' },
        itemHoverStyle: {
            color: '#b1b1b1'
        }
    },
    title: {
        text: ''
    },
    // Exporting is triggered from the sidebar, so hide the built-in menu button and never send chart
    // data to the Highcharts export server if local rendering fails
    exporting: {
        buttons: {
            contextButton: {
                enabled: false
            }
        },
        fallbackToExportServer: false,
        error: () => alert('Sorry, the chart image could not be created in this browser.')
    },
    tooltip: {
        shared: true,
        split: false,
        followPointer: true,
        backgroundColor: '#171923',
        style: {
            color: 'white',
            fontWeight: 'normal'
        },
        animation: 0,
        useHTML: true,
    },
    xAxis: {
        labels: {
            style: {
                color: "#b1b1b1"
            }
        }
    },
    yAxis: {
        opposite: false,
        gridLineColor: '#2c323d',
        labels: {
            style: {
                color: "#b1b1b1"
            }
        },
        title: ""
    }
};

const isForecastSeries = (series) => series.options.id?.endsWith('-forecast');

// For a forecast point, the likely range from the matching error-margin series, e.g. " (45 to 60)"
const describeForecastRange = (point) => {
    const rangeSeries = point.series.chart.get(point.series.options.id.replace(/-forecast$/, '-error'));
    const rangePoint = rangeSeries?.points?.find(candidate => candidate.x === point.x);
    if (!rangePoint) return '';
    return ` <span style="color: #a0aec0">(${Math.round(rangePoint.low).toLocaleString()} to ${Math.round(rangePoint.high).toLocaleString()})</span>`;
};

// Tooltip listing each series' value at the hovered point, under the given header
const buildTooltip = (header, points) => {
    const shownPoints = points
        // The range is shown alongside its forecast, and a forecast's first point repeats the last real value.
        // (Matched by x: Highstock's point.index isn't reliable here.)
        .filter(point => point.series.type !== 'arearange')
        .filter(point => !(isForecastSeries(point.series) && point.x === point.series.options.data?.[0]?.[0]));
    const allForecast = shownPoints.length > 0 && shownPoints.every(point => isForecastSeries(point.series));

    return `<span style="font-size: 18px">${allForecast ? `Forecast: ${header}` : header}</span><hr style="margin-top: 5px; margin-bottom: 5px;"/>${shownPoints
        .sort((pointA, pointB) => (pointB.y || 0) - (pointA.y || 0))
        .map((point) => {
            const val = Math.round(Number(point.y) || 0).toLocaleString();
            const isForecast = isForecastSeries(point.series);
            const name = isForecast ? point.series.linkedParent?.name ?? point.series.name : point.series.name;
            return `<div style="text-align: center">
                            <span style="color: ${point.color}; font-size: 16px"> ${truncateText(name)}: <strong>${val}</strong>${isForecast ? describeForecastRange(point) : ''}</span>
                        </div>`;
        })
        .join("\n")}`;
};

function dateTooltipFormatter() {
    return buildTooltip((new Date(this.x)).toDateString(), this.points);
}

// When aligned to first scrobble, x values are milliseconds elapsed since the first scrobble
function elapsedTooltipFormatter() {
    const header = this.x === 0 ? 'First scrobble' : `${formatDuration(this.x)} since first scrobble`;
    return buildTooltip(header, this.points);
}

function dateAxisLabelFormatter() {
    return this.axis.defaultLabelFormatter.call(this);
}

function elapsedAxisLabelFormatter() {
    return formatElapsedAxisLabel(this.value, this.axis.max - this.axis.min);
}

const blurFocusedElement = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

function ChartPage() {
    // URL parameters
    const params = useParams();
    const { user, timePeriod: urlTimePeriod, urlDataSource } = params;

    // API info state
    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [timePeriod, setTimePeriod] = useState(urlTimePeriod)
    const [username, setUsername] = useState(user)
    const [loadingText, setLoadingText] = useState('')
    const [loadProgress, setLoadProgress] = useState(0)
    const [startDate, setStartDate] = useState(urlTimePeriod === 'overall' ? null : Math.floor((getStartDateFromTimePeriod(urlTimePeriod) / 1000)))

    // Chart visualisation state
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');
    const [stackingType, setStackingType] = useState(undefined)
    const [smoothStrength, setSmoothStrength] = useState(0)
    const [alignedToFirstScrobble, setAlignedToFirstScrobble] = useState(false)

    // Navigator and Legend state
    const [navigatorEnabled, setNavigatorEnabled] = useState(() => JSON.parse(localStorage.getItem('navigatorEnabled')) ?? false);
    const [legendEnabled, setLegendEnabled] = useState(() => JSON.parse(localStorage.getItem('legendEnabled')) ?? true);

    // Forecasting state, remembered between visits
    const [forecastingEnabled, setForecastingEnabled] = useState(() => getStoredSetting('forecastingEnabled', false));
    const [forecastHistory, setForecastHistory] = useState(() => getStoredSetting('forecastHistory', 30));
    const [forecastLength, setForecastLength] = useState(() => getStoredSetting('forecastLength', 10));
    const [showMarginOfError, setShowMarginOfError] = useState(() => getStoredSetting('forecastShowRange', true));
    // Rank positions can't be meaningfully forecast
    const forecastUnavailable = dataPresentationMode === 'periodRankingPositions';
    const persistForecastSetting = (name, setter) => (value) => {
        setter(value);
        saveToLocalStorage({ name, value });
    };

    // Chart management state
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataSource, setDataSource] = useState(urlDataSource)
    const [chartHasLoaded, setChartHasLoaded] = useState(false)
    const [pointStart, setPointStart] = useState(undefined);
    const [pointInterval, setPointInterval] = useState(undefined);
    const chartRef = useRef(null);
    const [userInfoOpen, setUserInfoOpen] = useState(false);

    // When the forecast is toggled or lengthened while the chart shows its full range, zoom out afterwards
    // so the whole forecast is visible. A user who has zoomed in keeps their zoom.
    const showFullRangeAfterUpdate = useRef(false);
    const withFullRangeKept = (setter, currentValue) => (value) => {
        const axis = chartRef.current?.chart?.xAxis?.[0];
        if (axis && value !== currentValue) {
            const { min, max, dataMin, dataMax } = axis.getExtremes();
            showFullRangeAfterUpdate.current = min <= dataMin && max >= dataMax;
        }
        setter(value);
    };


    const seriesData = useMemo(() => {
        if (!scrobblingData) return [];

        return activeItems.map((itemIdx, index) => {
            if (!scrobblingData[itemIdx]) return null;

            const scrobbleItem = scrobblingData[itemIdx];
            let data = [...scrobbleItem[dataPresentationMode]];

            if (alignedToFirstScrobble) {
                const firstScrobbleIndex = scrobbleItem.noncumulativeScrobbleData.findIndex(playcount => playcount > 0);
                const leadingValue = dataPresentationMode === 'periodRankingPositions' ? null : 0;
                data = calculateAlignedDataset(data, firstScrobbleIndex, leadingValue);
            }

            if (smoothStrength > 0) {
                data = smoothDataset(data, smoothStrength);
            }

            const color = chartSeriesColours[index % chartSeriesColours.length];
            const seriesId = `series-${dataSource}-${itemIdx}`;

            const series = [{
                id: seriesId,
                name: scrobbleItem.name,
                data: data,
                color: color,
                zIndex: 2,
                dashStyle: 'solid'
            }];

            if (forecastingEnabled && !forecastUnavailable && pointStart && pointInterval) {
                const seriesPointStart = alignedToFirstScrobble ? 0 : pointStart;
                const isCumulative = dataPresentationMode === 'cumulativeScrobbleData';
                try {
                    const forecastData = calculateForecast(data, forecastHistory, forecastLength, isCumulative);
                    if (forecastData && forecastData.forecastData.length > 0) {
                        series.push({
                            id: `${seriesId}-forecast`,
                            name: `${scrobbleItem.name} (Forecast)`,
                            data: forecastData.forecastData.map(([idx, val]) => [seriesPointStart + idx * pointInterval, val]),
                            color: color,
                            dashStyle: 'dot',
                            zIndex: 2,
                            linkedTo: seriesId,
                            showInLegend: false,
                            // The navigator draws the first series; continue it with that series' forecast
                            showInNavigator: index === 0,
                            navigatorOptions: { dashStyle: 'Dot', fillOpacity: 0.02 }
                        });

                        if (showMarginOfError) {
                            series.push({
                                id: `${seriesId}-error`,
                                name: `${scrobbleItem.name} (Error Margin)`,
                                type: 'arearange',
                                data: forecastData.marginOfErrorData.map(([idx, low, high]) => [seriesPointStart + idx * pointInterval, low, high]),
                                color: color,
                                fillOpacity: 0.15,
                                lineWidth: 0,
                                zIndex: 1,
                                linkedTo: seriesId,
                                showInLegend: false,
                                marker: { enabled: false }
                            });
                        }
                    }
                } catch (e) {
                    console.error("Forecast failed for", scrobbleItem.name, e);
                }
            }
            return series;
        }).filter(Boolean).flat();
    }, [scrobblingData, activeItems, dataPresentationMode, alignedToFirstScrobble, smoothStrength, forecastingEnabled, forecastUnavailable, pointStart, pointInterval, forecastHistory, forecastLength, showMarginOfError, dataSource]);

    // Number of periods loaded; the forecast lookback can't use more than this
    const availablePeriods = scrobblingData?.[0]?.noncumulativeScrobbleData.length;

    // Marks where the forecast starts with a dashed line and shades the forecast region. Not shown when aligned
    // to first scrobble, since each series then ends (and its forecast starts) at a different point.
    const forecastRegion = useMemo(() => {
        const hasForecast = seriesData.some(series => series.id?.endsWith('-forecast'));
        if (!hasForecast || alignedToFirstScrobble || !availablePeriods) return null;
        const from = pointStart + (availablePeriods - 1) * pointInterval;
        return { from, to: from + forecastLength * pointInterval };
    }, [seriesData, alignedToFirstScrobble, availablePeriods, pointStart, pointInterval, forecastLength]);

    const chartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: {
            ...baseChartOptions.chart,
            type: chartType,
        },
        navigator: {
            ...baseChartOptions.navigator,
            enabled: navigatorEnabled,
            xAxis: {
                ...baseChartOptions.navigator.xAxis,
                labels: {
                    ...baseChartOptions.navigator.xAxis.labels,
                    formatter: alignedToFirstScrobble ? elapsedAxisLabelFormatter : dateAxisLabelFormatter
                }
            }
        },
        // Date-based range buttons and inputs don't apply to time since first scrobble
        rangeSelector: {
            ...baseChartOptions.rangeSelector,
            enabled: !alignedToFirstScrobble
        },
        xAxis: {
            ...baseChartOptions.xAxis,
            labels: {
                ...baseChartOptions.xAxis.labels,
                formatter: alignedToFirstScrobble ? elapsedAxisLabelFormatter : dateAxisLabelFormatter
            },
            // Empty arrays clear the marker when forecasting is turned off
            plotLines: forecastRegion ? [{
                value: forecastRegion.from,
                color: '#718096',
                dashStyle: 'Dash',
                width: 1,
                zIndex: 3,
                label: { text: 'Forecast', rotation: 0, x: 6, y: 14, style: { color: '#a0aec0', fontSize: '12px' } }
            }] : [],
            plotBands: forecastRegion ? [{
                from: forecastRegion.from,
                to: forecastRegion.to,
                color: 'rgba(255, 255, 255, 0.03)'
            }] : []
        },
        tooltip: {
            ...baseChartOptions.tooltip,
            formatter: alignedToFirstScrobble ? elapsedTooltipFormatter : dateTooltipFormatter
        },
        scrollbar: {
            ...baseChartOptions.scrollbar,
            enabled: navigatorEnabled
        },
        legend: {
            ...baseChartOptions.legend,
            enabled: legendEnabled
        },
        plotOptions: {
            ...baseChartOptions.plotOptions,
            series: {
                stacking: stackingType !== "overlap" ? stackingType : undefined,
                pointStart: alignedToFirstScrobble ? 0 : pointStart,
                pointInterval: pointInterval
            }
        },
        series: seriesData
    }), [seriesData, chartType, navigatorEnabled, legendEnabled, stackingType, pointStart, pointInterval, alignedToFirstScrobble, forecastRegion]);

    // Runs after HighchartsReact has applied the new options (it updates the chart in a layout effect)
    useEffect(() => {
        if (!showFullRangeAfterUpdate.current) return;
        showFullRangeAfterUpdate.current = false;
        chartRef.current?.chart?.xAxis?.[0]?.setExtremes();
    }, [chartOptions]);

    // Get user info on initial page load / when user changes
    useEffect(() => {
        if (!username) return;

        if (localStorage.getItem('legendEnabled') === null) {
            localStorage.setItem("legendEnabled", "true")
        }

        getUserInfo(username).then(response => {
            setUserInfo(response)
            if (timePeriod === 'overall' && response?.registered?.['#text']) {
                const regDate = parseInt(response.registered['#text']);
                if (!isNaN(regDate)) {
                    setStartDate(regDate);
                }
            }
        }).catch(error => {
            console.error("Error loading user info:", error)
        })
    }, [username]);

    useEffect(() => {
        if (!userInfo || !startDate || !timePeriod) return;

        // Ensure startDate is a valid number and not 0
        if (typeof startDate !== 'number' || startDate <= 0) return;

        let isCancelled = false;

        setLoadingText(`loading ${username}'s ${dataSource} chart`);
        setChartHasLoaded(false);
        setLoadProgress(0);
        setActiveItems([0, 1, 2, 3, 4]); // Reset active items

        // Clear existing data to prevent old chart from showing
        setScrobblingData(undefined);

        const timePeriodToScrobblePeriod = {
            "overall": 150,
            "lastyear": 150,
            "6month": 180,
            "3month": 90,
            "lastmonth": 30,
        }

        const numberOfScrobblePeriods = timePeriodToScrobblePeriod[timePeriod] || 150;
        const scrobblingPeriods = generateScrobblingPeriods(startDate, numberOfScrobblePeriods);

        // Check if valid periods
        if (scrobblingPeriods.length === 0) {
            setLoadingText("Invalid date range");
            return;
        }

        // Calculate time interval based on actual generated periods
        const actualStartTime = scrobblingPeriods[0].fromUnix * 1000;
        const lastPeriod = scrobblingPeriods[scrobblingPeriods.length - 1];
        const actualEndTime = lastPeriod.toUnix * 1000;
        const actualInterval = (actualEndTime - actualStartTime) / scrobblingPeriods.length;

        // Batch progress updates to at most one per animation frame, so the bar animates smoothly
        // without re-rendering the page for every request that completes in the same frame
        let latestProgress = 0;
        let progressFrame = null;
        getScrobblingDataForAllPeriods(username, scrobblingPeriods, dataSource, (progress) => {
            if (isCancelled) return;
            latestProgress = progress;
            if (progressFrame === null) {
                progressFrame = requestAnimationFrame(() => {
                    progressFrame = null;
                    if (!isCancelled) setLoadProgress(latestProgress);
                });
            }
        })
            .then(response => {
                if (isCancelled) return;
                const newData = createScrobblingDataObjects(response);

                setPointStart(actualStartTime);
                setPointInterval(actualInterval);
                setScrobblingData(newData);
            })
            .catch(error => {
                if (isCancelled) return;
                console.error("Error loading scrobbling data:", error);
                setLoadingText("Error loading data");
            });

        return () => {
            isCancelled = true;
            if (progressFrame !== null) cancelAnimationFrame(progressFrame);
        };
    }, [userInfo, dataSource, startDate, timePeriod, username]);

    const createScrobblingDataObjects = (scrobblingData) => {
        const itemMap = new Map();
        const numPeriods = scrobblingData.length;

        scrobblingData.forEach((period, periodIndex) => {
            period.forEach(item => {
                const artist = dataSource !== 'artist' ? (item.artist?.['#text'] || '') : null;
                // Tracks/albums are keyed by name + artist so same-named items from different artists stay separate
                const itemId = artist ? `${item.name} — ${artist}` : item.name;
                if (!itemMap.has(itemId)) {
                    const newItem = new ScrobbleItem(item.name, artist);
                    newItem.id = itemId;
                    // Initialize empty data arrays
                    newItem.cumulativeScrobbleData = new Array(numPeriods).fill(0);
                    newItem.noncumulativeScrobbleData = new Array(numPeriods).fill(0);
                    newItem.periodRankingPositions = new Array(numPeriods).fill(null);
                    itemMap.set(itemId, newItem);
                }

                const scrobbleItem = itemMap.get(itemId);
                const playcount = parseInt(item.playcount) || 0;

                scrobbleItem.noncumulativeScrobbleData[periodIndex] = playcount;
                scrobbleItem.totalScrobbles += playcount;
                scrobbleItem.periodRankingPositions[periodIndex] = (parseInt(item["@attr"]?.rank) || 0) - 1;
            });
        });

        const formattedScrobblingData = Array.from(itemMap.values());

        // Calculate cumulative data
        formattedScrobblingData.forEach(item => {
            let runningTotal = 0;
            for (let i = 0; i < numPeriods; i++) {
                runningTotal += item.noncumulativeScrobbleData[i];
                item.cumulativeScrobbleData[i] = runningTotal;
            }
        });

        // Sort the data by total scrobbles
        formattedScrobblingData.sort((a, b) => b.totalScrobbles - a.totalScrobbles);

        return formattedScrobblingData;
    };

    const generateScrobblingPeriods = (searchStartDate, numberOfScrobblePeriods) => {
        const currentUnixSeconds = Math.floor(Date.now() / 1000);

        // Ensure startDate is not in the future and is a valid number
        let startTimestamp = parseInt(searchStartDate);
        if (isNaN(startTimestamp) || startTimestamp <= 0) return [];

        // Cap start date by account registration date if available
        const registrationDate = parseInt(userInfo?.registered?.['#text']);
        if (!isNaN(registrationDate)) {
            startTimestamp = Math.max(startTimestamp, registrationDate);
        }

        const validStartDate = Math.min(startTimestamp, currentUnixSeconds - 86400); // At least 1 day ago
        const ageInSeconds = currentUnixSeconds - validStartDate;
        const ageInDays = Math.floor(ageInSeconds / 86400);

        // If the account is newer than the requested number of periods, use 1 period per day instead
        const periodLengthSeconds = ageInDays < numberOfScrobblePeriods
            ? 86400
            : Math.floor(ageInSeconds / numberOfScrobblePeriods);

        let scrobblingPeriods = [];

        // Generate "from" and "to" unix timestamps for api requests
        const limit = currentUnixSeconds - (periodLengthSeconds / 2); // Avoid generating a tiny final period
        for (let scrobblingPeriod = validStartDate; scrobblingPeriod < limit; scrobblingPeriod += periodLengthSeconds) {

            let periodStartUnix = scrobblingPeriod;
            let periodEndUnix = Math.min(scrobblingPeriod + periodLengthSeconds, currentUnixSeconds);

            scrobblingPeriods.push({
                fromUnix: periodStartUnix,
                toUnix: periodEndUnix,
                fromDate: new Date(periodStartUnix * 1000).toUTCString(),
                toDate: new Date(periodEndUnix * 1000).toUTCString()
            });
        }
        return scrobblingPeriods;
    }


    // Reloads chart flag after scrobbling data source changes
    useEffect(() => {
        if (scrobblingData === undefined) return;
        // Set chartHasLoaded after a brief delay to ensure chart is rendered
        const timer = setTimeout(() => setChartHasLoaded(true), 100);
        return () => clearTimeout(timer);
    }, [scrobblingData]);



    // Callbacks are memoised so SeriesEntriesSearch (React.memo) only re-renders when its data changes
    const clearSeriesData = useCallback(() => {
        setActiveItems([])
    }, [])

    const resetSeriesData = useCallback(() => {
        setActiveItems([0, 1, 2, 3, 4])
    }, [])

    const removeFromActiveItems = useCallback((index) => {
        setActiveItems(prev => prev.filter((_, i) => i !== index));
    }, [])

    const addToActiveItems = useCallback((itemId) => {
        const index = scrobblingData.findIndex(item => item.id === itemId);
        if (index !== -1) {
            setActiveItems(prev => [...prev, index]);
        }
    }, [scrobblingData])

    const toggleAlignedToFirstScrobble = () => {
        setAlignedToFirstScrobble(prev => !prev);
    }

    const exportFilename = `scrobbleflow-${username}-${dataSource}-${timePeriod}`;

    const handleExportCsv = () => {
        const chart = chartRef.current?.chart;
        if (chart) exportChartAsCsv(chart, `${exportFilename}.csv`, alignedToFirstScrobble);
    }

    const handleExportImage = () => {
        const chart = chartRef.current?.chart;
        if (!chart) return;
        // last.fm returns the avatar in several sizes; 'large' (174px) stays sharp in the 2x export
        const images = userInfo?.image || [];
        const avatarUrl = (images.find(image => image.size === 'large') || images[images.length - 1])?.['#text'];
        return exportChartAsImage(chart, exportFilename, {
            username: userInfo?.name || username,
            avatarUrl: avatarUrl || undefined
        }).catch(error => {
            console.error('Chart image export failed', error);
            alert('Sorry, the chart image could not be created in this browser.');
        });
    }

    return (
        <Container maxW={'100%'} p={0} m={0}>
            {/* The page itself never scrolls: the sidebar scrolls on its own and the chart stays in view */}
            <Grid templateColumns={'minmax(min-content, 1fr) 5fr'} h={'100vh'} overflow={'hidden'}>
                {/* minmax(min-content, ...) keeps the sidebar as wide as its content needs: a scrolling grid
                    item would otherwise be allowed to shrink to a sixth of the page and squash the controls */}
                <GridItem
                    className={'sidebar-column'}
                    h={'100vh'}
                    display={'flex'}
                    flexDirection={'column'}
                    overflow={'hidden'}
                >
                    {/* Header and user info stay pinned at the top; only the options below them scroll */}
                    <Box flexShrink={0} position={'relative'} zIndex={2}>
                        <HeaderBar />
                        <UserInfoAccordion
                            userInfo={userInfo}
                            setDataSource={setDataSource}
                            hasLoaded={chartHasLoaded}
                            setStartDate={setStartDate}
                            setTimePeriod={setTimePeriod}
                            setUsername={setUsername}
                            isOpen={userInfoOpen}
                            onOpenChange={setUserInfoOpen}
                        />
                    </Box>
                    <Box flex={1} minH={0} position={'relative'} zIndex={1}>
                        <Box
                            h={'100%'}
                            overflowY={'auto'}
                            pb={3}
                            sx={{ scrollbarWidth: 'thin', scrollbarColor: '#4a5568 transparent' }}
                        >
                            <Box mt={3} ml={5} mr={5}>
                                <CustomDivider text={'Chart Settings'} />
                                <ChartSettings
                                    dataPresentationMode={dataPresentationMode}
                                    setDataPresentationMode={setDataPresentationMode}
                                    setChartType={setChartType}
                                    setStackingType={setStackingType}
                                />
                                <CustomDivider text={'Series Entries'} />
                                <SeriesEntriesSearch
                                    scrobblingData={scrobblingData}
                                    chartHasLoaded={chartHasLoaded}
                                    dataSource={dataSource}
                                    activeItems={activeItems}
                                    addToActiveItems={addToActiveItems}
                                    clearSeriesData={clearSeriesData}
                                    resetSeriesData={resetSeriesData}
                                    removeFromActiveItems={removeFromActiveItems}
                                    chartSeriesColours={chartSeriesColours}
                                />
                                <CustomDivider text={'Visualisation Options'} />
                                <VisualisationOptions
                                    smoothStrength={smoothStrength}
                                    setSmoothStrength={setSmoothStrength}
                                />
                                <ForecastingOptions
                                    forecastingEnabled={forecastingEnabled}
                                    setForecastingEnabled={persistForecastSetting('forecastingEnabled', withFullRangeKept(setForecastingEnabled, forecastingEnabled))}
                                    forecastHistory={forecastHistory}
                                    setForecastHistory={persistForecastSetting('forecastHistory', setForecastHistory)}
                                    forecastLength={forecastLength}
                                    setForecastLength={persistForecastSetting('forecastLength', withFullRangeKept(setForecastLength, forecastLength))}
                                    showMarginOfError={showMarginOfError}
                                    setShowMarginOfError={persistForecastSetting('forecastShowRange', setShowMarginOfError)}
                                    pointInterval={pointInterval}
                                    availablePeriods={availablePeriods}
                                    isUnavailable={forecastUnavailable}
                                />
                                <MiscellaneousOptions
                                    alignedToFirstScrobble={alignedToFirstScrobble}
                                    toggleAlignedToFirstScrobble={toggleAlignedToFirstScrobble}
                                    navigatorEnabled={navigatorEnabled}
                                    setNavigatorEnabled={setNavigatorEnabled}
                                    legendEnabled={legendEnabled}
                                    setLegendEnabled={setLegendEnabled}
                                    saveToLocalStorage={saveToLocalStorage}
                                />
                                <CustomDivider text={'Export'} />
                                <ExportOptions
                                    isDisabled={!chartHasLoaded}
                                    onExportCsv={handleExportCsv}
                                    onExportImage={handleExportImage}
                                />
                            </Box>
                        </Box>
                        {/* Dims the options while the user info panel is open; clicking it closes the panel.
                            The fade is on the overlay itself rather than a Chakra Fade wrapper: a wrapper with
                            opacity < 1 forms its own stacking context, so the overlay's z-index wouldn't apply
                            until the fade finished and the slider thumb (z-index 1) would darken late.
                            It fades in and disappears instantly when closed, like the panel. */}
                        <AnimatePresence>
                            {userInfoOpen && (
                                <motion.div
                                    key={'user-info-overlay'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, transition: { duration: 0.2 } }}
                                    exit={{ opacity: 0, transition: { duration: 0 } }}
                                    onClick={() => setUserInfoOpen(false)}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        // Above controls that set their own z-index, e.g. the slider thumb
                                        zIndex: 10,
                                        background: 'rgba(0, 0, 0, 0.48)'
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </Box>
                </GridItem>
                {/* Highcharts prevents the default mousedown action (for drag-to-zoom), which stops the browser
                    moving focus off the series search input, so its results list would stay open. Blur manually. */}
                <GridItem h={'100vh'} minW={0} pt={5} pr={5} onMouseDownCapture={blurFocusedElement}>
                    {
                        !chartHasLoaded ?
                            <HStack w={'100%'} h={'100%'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                                <Text fontSize={'xl'} mb={4}>{loadingText}</Text>
                                {!loadingText.includes('Error') && !loadingText.includes('Invalid') && (
                                    <Box w="50%" maxW="400px">
                                        <Progress
                                            value={loadProgress}
                                            size="xs"
                                            h={2}
                                            colorScheme="blue"
                                            borderRadius="full"
                                            bg="gray.700"
                                        />
                                        <Text mt={2} textAlign="center" fontSize="sm" color="gray.400">
                                            {loadProgress}% complete
                                        </Text>
                                    </Box>
                                )}
                            </HStack>
                            :
                            <Fade in={chartHasLoaded} transition={{ enter: { duration: 0.5 } }}>
                                {/* Remount when switching between dates and time since first scrobble so the
                                    zoom range from one x-axis scale isn't carried over to the other */}
                                <HighchartsReact
                                    key={alignedToFirstScrobble ? 'time-since-first-scrobble' : 'dates'}
                                    ref={chartRef}
                                    highcharts={Highcharts}
                                    constructorType={'stockChart'}
                                    options={chartOptions}
                                    containerProps={{ style: { height: 'calc(100vh - 40px)' } }}
                                />
                            </Fade>
                    }
                </GridItem>
            </Grid>
        </Container >
    )
}

export { ChartPage }