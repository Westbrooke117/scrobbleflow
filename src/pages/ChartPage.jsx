import '../App.css'
import { useEffect, useState, useMemo } from "react";
import { getScrobblingDataForAllPeriods, getUserInfo } from "../api/api.js";
import Highcharts from 'highcharts/highstock'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsReact from "highcharts-react-official";
import { calculateForecast } from "../utils/forecastingUtils.js";
HighchartsMore(Highcharts)
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
import { deepCopy, getStartDateFromTimePeriod, truncateText } from "../utils/helperFunctions.js";
import { HeaderBar } from "../components/HeaderBar.jsx";
import { UserInfoAccordion } from "../components/UserInfoAccordion.jsx";
import {
    calculateAlignedDataset,
    getSmoothStrengthLabel,
    smoothDataset,
    sortArrayByTotalScrobbles,
    chartSeriesColours
} from "../utils/chartUtils.js";
import { getLocalStorageItems, saveToLocalStorage } from "../utils/localStorageManager.js";
import { ScrobbleItem } from "../utils/ScrobbleItem.js";

// Extracted Components
import { ChartSettings } from "../components/ChartPage/ChartSettings.jsx";
import { VisualificationOptions as VisualisationOptions } from "../components/ChartPage/VisualisationOptions.jsx";
import { ForecastingOptions } from "../components/ChartPage/ForecastingOptions.jsx";
import { MiscellaneousOptions } from "../components/ChartPage/MiscellaneousOptions.jsx";
import { SeriesEntriesSearch } from "../components/ChartPage/SeriesEntriesSearch.jsx";


function ChartPage() {
    // URL parameters
    const params = useParams();
    const { user, timePeriod: urlTimePeriod, urlDataSource } = params;

    // API info state
    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [currentInputUsername, setCurrentInputUsername] = useState(user)
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

    // Forecasting state
    const [forecastingEnabled, setForecastingEnabled] = useState(false);
    const [forecastHistory, setForecastHistory] = useState(30);
    const [forecastLength, setForecastLength] = useState(10);
    const [showMarginOfError, setShowMarginOfError] = useState(true);

    // Chart management state
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataSource, setDataSource] = useState(urlDataSource)
    const [chartHasLoaded, setChartHasLoaded] = useState(false)
    const [pointStart, setPointStart] = useState(undefined);
    const [pointInterval, setPointInterval] = useState(undefined);


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
            formatter() {
                const chart = this;

                return `<span style="font-size: 18px">${(new Date(chart.x)).toDateString()}</span><hr style="margin-top: 5px; margin-bottom: 5px;"/>${chart.points
                    .filter(point => point.series.type !== 'arearange')
                    .sort((pointA, pointB) => (pointB.y || 0) - (pointA.y || 0))
                    .map((point) => {
                        const val = Math.round(Number(point.y) || 0).toLocaleString();
                        return `<div style="text-align: center">
                                        <span style="color: ${point.color}; font-size: 16px"> ${truncateText(point.series.name)}: <strong>${val}</strong></span>
                                    </div>`;
                    })
                    .join("\n")}`;
            },
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

    const seriesData = useMemo(() => {
        if (!scrobblingData) return [];

        return activeItems.map((itemIdx, index) => {
            if (!scrobblingData[itemIdx]) return null;

            const scrobbleItem = scrobblingData[itemIdx];
            let data = [...scrobbleItem[dataPresentationMode]];

            if (alignedToFirstScrobble) {
                data = calculateAlignedDataset(data);
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

            if (forecastingEnabled && pointStart && pointInterval) {
                const isCumulative = dataPresentationMode === 'cumulativeScrobbleData';
                try {
                    const forecastData = calculateForecast(data, forecastHistory, forecastLength, isCumulative);
                    if (forecastData && forecastData.forecastData.length > 0) {
                        series.push({
                            id: `${seriesId}-forecast`,
                            name: `${scrobbleItem.name} (Forecast)`,
                            data: forecastData.forecastData.map(([idx, val]) => [pointStart + idx * pointInterval, val]),
                            color: color,
                            dashStyle: 'dot',
                            zIndex: 2,
                            linkedTo: seriesId,
                            showInLegend: false
                        });

                        if (showMarginOfError) {
                            series.push({
                                id: `${seriesId}-error`,
                                name: `${scrobbleItem.name} (Error Margin)`,
                                type: 'arearange',
                                data: forecastData.marginOfErrorData.map(([idx, low, high]) => [pointStart + idx * pointInterval, low, high]),
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
    }, [scrobblingData, activeItems, dataPresentationMode, alignedToFirstScrobble, smoothStrength, forecastingEnabled, pointStart, pointInterval, forecastHistory, forecastLength, showMarginOfError, dataSource]);

    const chartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: {
            ...baseChartOptions.chart,
            type: chartType,
        },
        navigator: {
            ...baseChartOptions.navigator,
            enabled: navigatorEnabled
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
                pointStart: pointStart,
                pointInterval: pointInterval
            }
        },
        series: seriesData
    }), [seriesData, chartType, navigatorEnabled, legendEnabled, stackingType, pointStart, pointInterval]);

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
    }, [username, timePeriod]);

    useEffect(() => {
        if (!userInfo || !startDate || !timePeriod) return;

        // Ensure startDate is a valid number and not 0
        if (typeof startDate !== 'number' || startDate <= 0) return;

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

        getScrobblingDataForAllPeriods(username, scrobblingPeriods, dataSource, (progress) => {
            setLoadProgress(progress);
        })
            .then(response => {
                const newData = createScrobblingDataObjects(response);

                setPointStart(actualStartTime);
                setPointInterval(actualInterval);
                setScrobblingData(newData);
            })
            .catch(error => {
                console.error("Error loading scrobbling data:", error);
                setLoadingText("Error loading data");
            });
    }, [userInfo, dataSource, startDate, timePeriod, username]);

    const createScrobblingDataObjects = (scrobblingData) => {
        const itemMap = new Map();
        const numPeriods = scrobblingData.length;

        scrobblingData.forEach((period, periodIndex) => {
            period.forEach(item => {
                const itemName = item.name;
                if (!itemMap.has(itemName)) {
                    const newItem = new ScrobbleItem(itemName);
                    if (dataSource !== 'artist') {
                        newItem.artist = item.artist?.['#text'] || '';
                    }
                    // Initialize empty data arrays
                    newItem.cumulativeScrobbleData = new Array(numPeriods).fill(0);
                    newItem.noncumulativeScrobbleData = new Array(numPeriods).fill(0);
                    newItem.periodRankingPositions = new Array(numPeriods).fill(null);
                    itemMap.set(itemName, newItem);
                }

                const scrobbleItem = itemMap.get(itemName);
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

        let periodLengthSeconds;
        let actualNumberOfPeriods;

        // If the account is newer than the requested number of periods, use 1 period per day instead
        if (ageInDays < numberOfScrobblePeriods) {
            actualNumberOfPeriods = Math.max(ageInDays, 1);
            periodLengthSeconds = 86400;
        } else {
            actualNumberOfPeriods = numberOfScrobblePeriods;
            periodLengthSeconds = Math.floor(ageInSeconds / numberOfScrobblePeriods);
        }

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
        setTimeout(() => setChartHasLoaded(true), 100);
    }, [scrobblingData]);



    const clearSeriesData = () => {
        let activeItemsEmpty = []
        setActiveItems(activeItemsEmpty)
    }

    const resetSeriesData = () => {
        let activeItemsReset = [0, 1, 2, 3, 4]
        setActiveItems(activeItemsReset)
    }

    const removeFromActiveItems = (index) => {
        setActiveItems(prev => prev.filter((_, i) => i !== index));
    }

    const addToActiveItems = (itemName) => {
        const index = scrobblingData.findIndex(item => item.name === itemName);
        if (index !== -1) {
            setActiveItems(prev => [...prev, index]);
        }
    }

    const toggleAlignedToFirstScrobble = () => {
        setAlignedToFirstScrobble(prev => !prev);
    }

    return (
        <Container maxW={'100%'} p={0} m={0}>
            <Grid templateColumns={'repeat(6,1fr)'} h={'100vh'}>
                <GridItem colSpan={1} className={'sidebar-column'}>
                    <Box>
                        <HeaderBar />
                    </Box>
                    <UserInfoAccordion
                        userInfo={userInfo}
                        setDataSource={setDataSource}
                        hasLoaded={chartHasLoaded}
                        setStartDate={setStartDate}
                        setTimePeriod={setTimePeriod}
                        setUsername={setUsername}
                        currentInputUsername={currentInputUsername}
                        setCurrentInputUsername={setCurrentInputUsername}
                    />
                    <Box mt={3} ml={5} mr={5}>
                        <CustomDivider text={'Chart Settings'} />
                        <ChartSettings
                            dataPresentationMode={dataPresentationMode}
                            setDataPresentationMode={setDataPresentationMode}
                            setChartType={setChartType}
                            setStackingType={setStackingType}
                        />
                        <CustomDivider text={'Visualisation Options'} />
                        <VisualisationOptions
                            smoothStrength={smoothStrength}
                            setSmoothStrength={setSmoothStrength}
                        />
                        <ForecastingOptions
                            forecastingEnabled={forecastingEnabled}
                            setForecastingEnabled={setForecastingEnabled}
                            forecastHistory={forecastHistory}
                            setForecastHistory={setForecastHistory}
                            forecastLength={forecastLength}
                            setForecastLength={setForecastLength}
                            showMarginOfError={showMarginOfError}
                            setShowMarginOfError={setShowMarginOfError}
                            pointInterval={pointInterval}
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
                    </Box>
                </GridItem>
                <GridItem colSpan={5} mt={5} mr={5}>
                    {
                        !chartHasLoaded ?
                            <HStack w={'100%'} h={'100vh'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
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
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    constructorType={'stockChart'}
                                    options={chartOptions}
                                    containerProps={{ style: { height: '97vh' } }}
                                />
                            </Fade>
                    }
                </GridItem>
            </Grid>
        </Container >
    )
}

export { ChartPage }