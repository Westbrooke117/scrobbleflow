import '../App.css'
import {useEffect, useState} from "react";
import {getScrobblingDataForAllPeriods, getUserInfo} from "../api/api.js";
import Highcharts from 'highcharts/highstock'
import HighchartsReact from "highcharts-react-official";
import {
    HStack,
    Text,
    Select,
    Box,
    Container,
    Grid,
    GridItem,
    Button,
    Tag,
    TagLabel,
    TagCloseButton,
    Checkbox,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Flex,
    Fade,
    Spinner, Tooltip,
} from "@chakra-ui/react";
import {useParams} from "react-router-dom";
import {CustomDivider} from "../components/CustomDivider.jsx";
import {AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList} from "@choc-ui/chakra-autocomplete";
import {deepCopy, getStartDateFromTimePeriod, truncateText} from "../utils/helperFunctions.js";
import {HeaderBar} from "../components/HeaderBar.jsx";
import {UserInfoAccordion} from "../components/UserInfoAccordion.jsx";
import {
    calculateAlignedDataset,
    getSmoothStrengthLabel,
    smoothDataset,
    sortArrayByTotalScrobbles
} from "../utils/chartUtils.js";
import {getLocalStorageItems, saveToLocalStorage} from "../utils/localStorageManager.js";

class ScrobbleItem {
    constructor(name, artist=null){
        this.name = name;
        this.artist = artist;
        this.totalScrobbles = 0;
        this.cumulativeScrobbleData = [];
        this.noncumulativeScrobbleData = [];
        this.periodRankingPositions = [];
    }

    calculateTotalScrobbles(scrobblingData){
        let runningTotal = 0;

        scrobblingData.map(period => {
            period.map(item => {
                if (item.name === this.name){
                    runningTotal += parseInt(item.playcount)
                }
            })
        })
        this.totalScrobbles = runningTotal;
    }

    calculateLongitudinalData(scrobblingData){
        let cumulativeScrobbleData= [];
        let runningTotal = 0;
        let noncumulativeScrobbleData = [];
        let periodRankingPositions = [];

        scrobblingData.map(period => {
            let item = period.find(item => item.name === this.name)

            if (item !== undefined){
                runningTotal += parseInt(item.playcount)
                cumulativeScrobbleData.push(runningTotal);
                noncumulativeScrobbleData.push(parseInt(item.playcount))
                periodRankingPositions.push(parseInt(item["@attr"].rank) - 1);
            } else {
                runningTotal += 0;
                cumulativeScrobbleData.push(runningTotal);
                noncumulativeScrobbleData.push(0)
                periodRankingPositions.push(null);
            }
        })

        this.cumulativeScrobbleData = cumulativeScrobbleData;
        this.noncumulativeScrobbleData = noncumulativeScrobbleData;
        this.periodRankingPositions = periodRankingPositions;
    }
}

function ChartPage() {
    // URL parameters
    const params = useParams();
    const {user, timePeriod: urlTimePeriod, urlDataSource} = params;

    // API info state
    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [currentInputUsername, setCurrentInputUsername] = useState(user)
    const [timePeriod, setTimePeriod] = useState(urlTimePeriod)
    const [username, setUsername] = useState(user)
    const [loadingText, setLoadingText] = useState('')
    const [startDate, setStartDate] = useState(urlTimePeriod === 'overall' ? null : Math.floor((getStartDateFromTimePeriod(urlTimePeriod)/1000)))

    // Chart visualisation state
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');
    const [stackingType, setStackingType] = useState(undefined)
    const [smoothStrength, setSmoothStrength] = useState(0)
    const [alignedToFirstScrobble, setAlignedToFirstScrobble] = useState(false)

    // Chart management state
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataSource, setDataSource] = useState(urlDataSource)
    const [chartHasLoaded, setChartHasLoaded] = useState(false)
    const [chartOptions, setChartOptions] = useState({
        chart: {
            type: chartType,
            backgroundColor: '#1a202c',
        },
        navigator: {
            enabled: JSON.parse(localStorage.getItem('navigatorEnabled')) === true,
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
            enabled: JSON.parse(localStorage.getItem('navigatorEnabled')) === true,
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
            series: {
                stacking: stackingType,
            },
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
            enabled: JSON.parse(localStorage.getItem('legendEnabled')) === true || localStorage.getItem('legendEnabled') === null,
            itemStyle: {'color':'#eeefef'},
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
                    .sort((pointA, pointB) => pointB.y - pointA.y)
                    .map((point) => {
                        return `<div style="text-align: center">
                                        <span style="color: ${point.color}; font-size: 16px"> ${truncateText(point.series.name)}: <strong>${point.y.toLocaleString()}</strong></span>
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
        },
        series: {}
    });

    // Get user info on initial page load / when user changes
    useEffect(() => {
        if (!username) return;

        if (localStorage.getItem('legendEnabled') === null) {
            localStorage.setItem("legendEnabled", "true")
        }

        getUserInfo(username).then(response => {
            setUserInfo(response)
            if (timePeriod === 'overall' && response?.registered?.['#text']) {
                setStartDate(response.registered['#text'])
            }
        }).catch(error => {
            console.error("Error loading user info:", error)
        })
    }, [username, timePeriod]);

    useEffect(() => {
        if (!userInfo || !startDate || !timePeriod) return;

        // Additional check: ensure startDate is a valid number and not 0
        if (typeof startDate !== 'number' || startDate <= 0) return;

        setLoadingText(`loading ${username}'s ${dataSource} chart`);
        setChartHasLoaded(false);
        setActiveItems([0, 1, 2, 3, 4]); // Reset active items

        // Clear existing data to prevent old chart from showing
        setScrobblingData(undefined);

        const timePeriodToScrobblePeriod = {
            "overall" : 150,
            "lastyear" : 150,
            "6month" : 180,
            "3month" : 90,
            "lastmonth" : 30,
        }

        const numberOfScrobblePeriods = timePeriodToScrobblePeriod[timePeriod] || 150;
        const scrobblingPeriods = generateScrobblingPeriods(startDate, numberOfScrobblePeriods);

        // Check if we got valid periods
        if (scrobblingPeriods.length === 0) {
            setLoadingText("Invalid date range");
            return;
        }

        // Calculate the actual time interval based on generated periods
        const actualStartTime = scrobblingPeriods[0].fromUnix * 1000;
        const actualEndTime = scrobblingPeriods[scrobblingPeriods.length - 1].toUnix * 1000;
        const actualInterval = (actualEndTime - actualStartTime) / numberOfScrobblePeriods;

        getScrobblingDataForAllPeriods(username, scrobblingPeriods, dataSource)
            .then(response => {
                const newData = createScrobblingDataObjects(response);

                setChartOptions(prevOptions => ({
                    ...prevOptions,
                    plotOptions: {
                        ...prevOptions.plotOptions,
                        series: {
                            ...prevOptions.plotOptions?.series,
                            pointStart: actualStartTime,
                            pointInterval: actualInterval,
                        }
                    },
                    rangeSelector: {
                        ...prevOptions.rangeSelector,
                        selected: undefined  // Reset range selector to show all data
                    },
                    xAxis: {
                        ...prevOptions.xAxis,
                        range: undefined,  // Clear any previous range
                        min: undefined,
                        max: undefined
                    }
                }));

                // Set data after chart options are updated
                setScrobblingData(newData);
            })
            .catch(error => {
                console.error("Error loading scrobbling data:", error);
                setLoadingText("Error loading data");
            });
    }, [userInfo, dataSource, startDate, timePeriod, username]);

    const createScrobblingDataObjects = (scrobblingData) => {
        let listOfItemNames = new Set();
        // Note "item" in this context refers to either an artist, album, or track object from the last.fm API

        // Get unique list of item names
        scrobblingData.forEach(period => {
            period.forEach(item => {
                listOfItemNames.add(item.name);  // Set automatically handles uniqueness
            });
        });

        const getArtist = (scrobblingData, itemName) => {
            for (let period of scrobblingData) {
                for (let item of period) {
                    if (item.name === itemName) {
                        return item.artist['#text']; // Return the artist when found
                    }
                }
            }
            return null;  // In case no match is found
        };

        let formattedScrobblingData = [];

        listOfItemNames.forEach(itemName => {
            let item = new ScrobbleItem(itemName);

            if (dataSource !== 'artist') {
                // Used for additional context in series entry search box
                item.artist = getArtist(scrobblingData, itemName);
            }
            item.calculateTotalScrobbles(scrobblingData);
            item.calculateLongitudinalData(scrobblingData);

            formattedScrobblingData.push(item);
        });

        // Sort the data by total scrobbles BEFORE returning
        formattedScrobblingData.sort((a, b) => b.totalScrobbles - a.totalScrobbles);

        return formattedScrobblingData;
    };

    const generateScrobblingPeriods = (userRegistrationUnixTime, numberOfScrobblePeriods) => {
        const currentUnixSeconds = Math.floor(Date.now() / 1000);

        // Ensure startDate is not in the future
        const validStartDate = Math.min(startDate, currentUnixSeconds);

        const periodLengthSeconds = Math.floor((currentUnixSeconds - validStartDate) / numberOfScrobblePeriods);

        // Ensure we have a valid period length (at least 1 day)
        if (periodLengthSeconds < 86400) {
            console.error("Period length too small, using 1 day minimum");
            return [];
        }

        let scrobblingPeriods = [];

        // Generate "from" and "to" unix timestamps for api requests
        for (let scrobblingPeriod = validStartDate; scrobblingPeriod < currentUnixSeconds; scrobblingPeriod += periodLengthSeconds) {

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

    let chartSeriesColours = [ "#2caffe", "#544fc5", "#00e272", "#fe6a35", "#6b8abc", "#d568fb", "#2ee0ca", "#fa4b42", "#feb56a", "#91e8e1" ]

    const generateSeriesData = () => {
        // Create copy because otherwise highcharts mutates state
        const scrobblingDataCopy = deepCopy(scrobblingData);

        // Modify dataset to align to first scrobble
        if (alignedToFirstScrobble){
            activeItems.map(item => {
                scrobblingDataCopy[item][dataPresentationMode] = calculateAlignedDataset(scrobblingDataCopy[item][dataPresentationMode])
            })
        }

        // Modify dataset to smooth values
        if (smoothStrength > 0){
            activeItems.map(item => {
                scrobblingDataCopy[item][dataPresentationMode] = smoothDataset(scrobblingDataCopy[item][dataPresentationMode], smoothStrength)
            })
        }

        // Create series array
        let seriesData = []

        activeItems.map((item, index) => {
            seriesData.push(
                {
                    name: scrobblingDataCopy[item].name,
                    data: scrobblingDataCopy[item][dataPresentationMode],
                    color: chartSeriesColours[index]
                }
            )
        })

        return seriesData
    }

    // Reloads chart if scrobbling data source changes (artist, album, track)
    useEffect(() => {
        if (scrobblingData === undefined) return;

        setChartOptions((prevOptions) => ({
            ...prevOptions,
            series: generateSeriesData()
        }))

        // Set chartHasLoaded after a brief delay to ensure chart is rendered
        setTimeout(() => setChartHasLoaded(true), 100);

    }, [scrobblingData]);

    // Used to regenerate series data when chart settings changes
    useEffect(() => {
        if (!scrobblingData) return;

        setChartOptions((prevOptions) => ({
            ...prevOptions,
            series: generateSeriesData(),
            chart: {
                ...prevOptions.chart,
                type: chartType
            },
            plotOptions: {
                ...prevOptions.plotOptions,
                series: {
                    ...prevOptions.plotOptions.series,
                    stacking: stackingType !== "overlap" ? stackingType : undefined
                }
            },
            // Preserve navigator styling
            navigator: {
                ...prevOptions.navigator
            },
            scrollbar: {
                ...prevOptions.scrollbar
            }
        }))
    },[dataPresentationMode, chartType, activeItems, smoothStrength, alignedToFirstScrobble, stackingType])



    const clearSeriesData = () => {
        let activeItemsEmpty = []
        setActiveItems(activeItemsEmpty)
    }

    const resetSeriesData = () => {
        let activeItemsReset = [0,1,2,3,4]
        setActiveItems(activeItemsReset)
    }

    const removeFromActiveItems = (index) => {
        let activeItemsCopy = [...activeItems]
        activeItemsCopy.splice(index, 1)
        setActiveItems(activeItemsCopy)
    }

    const addToActiveItems = (itemName) => {
        let activeItemsCopy = [...activeItems]

        let index = scrobblingData.findIndex(item => item.name === itemName)

        activeItemsCopy.push(index)
        setActiveItems(activeItemsCopy)
    }

    const toggleAlignedToFirstScrobble = () => {
        alignedToFirstScrobble === true ? setAlignedToFirstScrobble(false) : setAlignedToFirstScrobble(true)
    }

    /*
    TODO: Allow forecasting of data?
    TODO: Better feedback for loading and error handling
     */

    return (
        <Container maxW={'100%'} p={0} m={0}>
            <Grid templateColumns={'repeat(6,1fr)'} h={'100vh'}>
                <GridItem colSpan={1} className={'sidebar-column'}>
                    <Box>
                        <HeaderBar/>
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
                        <CustomDivider text={'Chart Settings'}/>
                        <HStack mb={2} justifyContent={'space-evenly'} alignItems={'center'}>
                            <Button className={dataPresentationMode === 'cumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('cumulativeScrobbleData')}>Cumulative</Button>
                            <Button pl={6} pr={6} className={dataPresentationMode === 'noncumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('noncumulativeScrobbleData')}>Non-cumulative</Button>
                            <Button className={dataPresentationMode === 'periodRankingPositions' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('periodRankingPositions')}>Ranking</Button>
                        </HStack>
                        <HStack>
                            <Select mb={3} variant={'filled'} maxW={'100%'}
                                    onChange={(e) => setChartType(e.target.value)}>
                                <option value={"line"}>Line</option>
                                <option value={"spline"}>Smooth line</option>
                                <option value={"column"}>Column</option>
                                <option value={"area"}>Area</option>
                                <option value={"areaspline"}>Smooth area</option>
                            </Select>
                            <Select mb={3} variant={'filled'} maxW={'100%'}
                                    onChange={(e) => setStackingType(e.target.value)}>
                                <option value={"overlap"}>No stacking</option>
                                <option value={"normal"}>Stacked</option>
                                <option value={"percent"}>Percentage</option>
                            </Select>
                        </HStack>
                        <CustomDivider text={'Visualisation Options'}/>
                        <Box mb={2}>
                            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                                <Text fontSize={20} mb={1}>Data smoothing</Text>
                                <hr/>
                                <Text mt={1}>{getSmoothStrengthLabel(smoothStrength)}</Text>
                                <Slider defaultValue={0} min={0} max={3} onChange={(val) => setSmoothStrength(val)}>
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                            </Box>
                            <Box mb={2} mt={2}>
                                <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                                    <Text fontSize={20} mb={1}>Miscellaneous</Text>
                                    <hr/>
                                    <Flex mt={1}>
                                        <Text>Align data to first scrobble</Text>
                                        <Checkbox ml={2} onChange={() => toggleAlignedToFirstScrobble()}/>
                                    </Flex>
                                    <Flex mt={1}>
                                        <Text>Show chart navigator</Text>
                                        <Checkbox
                                            ml={2}
                                            defaultChecked={JSON.parse(localStorage.getItem('navigatorEnabled')) === true}
                                            onChange={(e) =>
                                            {
                                                setChartOptions((prevOptions) => ({
                                                    ...prevOptions,
                                                    navigator: {
                                                        ...prevOptions.navigator,
                                                        enabled: e.target.checked
                                                    },
                                                    scrollbar: {
                                                        ...prevOptions.scrollbar,
                                                        enabled: e.target.checked
                                                    }
                                                }))
                                                saveToLocalStorage({name: 'navigatorEnabled', value: e.target.checked})
                                            }
                                            }
                                        />
                                    </Flex>
                                    <Flex mt={1}>
                                        <Text>Show chart legend</Text>
                                        <Checkbox
                                            defaultChecked={JSON.parse(localStorage.getItem('legendEnabled')) === true || localStorage.getItem('legendEnabled') === null}
                                            ml={2}
                                            onChange={(e) =>
                                            {
                                                setChartOptions((prevOptions) => ({
                                                    ...prevOptions,
                                                    legend: {
                                                        ...(prevOptions.legend || {}),
                                                        enabled: e.target.checked
                                                    },
                                                }))
                                                saveToLocalStorage({name: 'legendEnabled', value: e.target.checked})
                                            }
                                            }
                                        />
                                    </Flex>
                                </Box>
                            </Box>
                        </Box>
                        <CustomDivider text={'Series Entries'}/>
                        {scrobblingData && chartHasLoaded ? (
                            <>
                                <AutoComplete openOnFocus listAllValuesOnFocus={true} maxSuggestions={50} onChange={(val) => addToActiveItems(val)}>
                                    <AutoCompleteInput placeholder={`Search for ${dataSource}...`} variant={'outline'}/>
                                    <AutoCompleteList m={0} p={0}>
                                        {
                                            sortArrayByTotalScrobbles(scrobblingData).map((item, index) => {
                                                // Check if the current index is in the activeItems array
                                                const isDisabled = activeItems.includes(index);
                                                const itemName = item?.name || 'Unknown';
                                                const artistName = item?.artist || 'Unknown Artist';
                                                const totalScrobbles = item?.totalScrobbles || 0;

                                                return (
                                                    <AutoCompleteItem
                                                        key={`item${index}`}
                                                        value={itemName}
                                                        whiteSpace={'nowrap'}
                                                        p={1}
                                                        pl={3}
                                                        m={0}
                                                        disabled={isDisabled}
                                                    >
                                                        <span>
                                                            {
                                                                dataSource === 'artist' ?
                                                                    <span>
                                                                        {truncateText(itemName, 40)} · <span style={{fontWeight: 'bold'}}>{totalScrobbles.toLocaleString()}</span>
                                                                    </span>
                                                                    :
                                                                    <span>
                                                                        {truncateText(itemName, 40)} · <span style={{fontWeight: 'bold'}}>{totalScrobbles.toLocaleString()}</span>
                                                                        <br/>
                                                                        <span style={{color: '#7285A5'}}>
                                                                            {truncateText(artistName, 40)}
                                                                        </span>
                                                                    </span>
                                                            }
                                                        </span>

                                                    </AutoCompleteItem>
                                                );
                                            })
                                        }
                                    </AutoCompleteList>
                                </AutoComplete>
                                <HStack mt={2} mb={2} justifyContent={'space-between'}>
                                    <Button onClick={() => clearSeriesData()} size={'sm'} w={'100%'}>Clear All</Button>
                                    <Button onClick={() => resetSeriesData()} size={'sm'} w={'100%'}>Reset</Button>
                                </HStack>
                            </>
                        ) : (
                            <Box textAlign="center" p={4}>
                                <Text>Loading data...</Text>
                            </Box>
                        )}
                        {
                            scrobblingData && chartHasLoaded &&
                            <Fade in={true}>
                                <Box display={'flex'} flexWrap={'wrap'} mt={2} mb={2}>
                                    {
                                        activeItems.map((item, index) => {
                                            const itemName = scrobblingData[item]?.name || 'Unknown';
                                            return (
                                                <Tag
                                                    title={itemName.length > 17 ? itemName : ""}
                                                    m={1}
                                                    key={item}
                                                    borderRadius={'full'}
                                                    variant={'solid'}
                                                >
                                                    <Box borderRadius={'full'} bg={chartSeriesColours[index % chartSeriesColours.length]} w={4} h={4} ml={-1} mr={1}/>
                                                    <TagLabel pb={1} pt={1}>{truncateText(itemName)}</TagLabel>
                                                    <TagCloseButton onClick={() => removeFromActiveItems(index)}/>
                                                </Tag>
                                            )
                                        })
                                    }
                                </Box>
                            </Fade>
                        }
                    </Box>
                </GridItem>
                <GridItem colSpan={5} mt={5} mr={5}>
                    {
                        !chartHasLoaded ?
                            <HStack w={'100%'} h={'100vh'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                                <Text fontSize={'xl'}>{loadingText}</Text>
                                {!loadingText.includes('Error') && !loadingText.includes('Invalid') && <Spinner size={'xl'} mt={4}/>}
                            </HStack>
                            :
                            <Fade in={chartHasLoaded} transition={{enter: {duration: 0.5}}}>
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
        </Container>
    )
}

export {ChartPage}