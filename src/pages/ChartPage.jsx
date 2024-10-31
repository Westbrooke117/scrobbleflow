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
    Spinner,
} from "@chakra-ui/react";
import {useParams} from "react-router-dom";
import {CustomDivider} from "../components/CustomDivider.jsx";
import {AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList} from "@choc-ui/chakra-autocomplete";
import {deepCopy, truncateText} from "../utils/helperFunctions.js";
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
    const {user} = useParams()

    // API info state
    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [currentInputUsername, setCurrentInputUsername] = useState(useParams().user)
    const [username, setUsername] = useState(useParams().user)

    // Chart visualisation state
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');
    const [stackingType, setStackingType] = useState(undefined)
    const [smoothStrength, setSmoothStrength] = useState(0)
    const [alignedToFirstScrobble, setAlignedToFirstScrobble] = useState(false)

    // Chart management state
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataSource, setDataSource] = useState(useParams().urlDataSource)
    const [chartHasLoaded, setChartHasLoaded] = useState(false)
    const [chartOptions, setChartOptions] = useState(
        {
            chart: {
                type: chartType,
                backgroundColor: '#1a202c',
            },
            navigator: {
                enabled: JSON.parse(localStorage.getItem('navigatorEnabled')) === true,
                outlineColor: '#3f444e'
            },
            scrollbar: {
                enabled: JSON.parse(localStorage.getItem('navigatorEnabled')) === true,
                barBackgroundColor: '#2c323d',
                trackBackgroundColor: '#171923',
                trackBorderColor: '#171923',
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
        }
    );

    // Get user info on initial page load / when user changes
    useEffect(() => {
        if (localStorage.getItem('legendEnabled') === null) localStorage.setItem("legendEnabled", true)

        getUserInfo(username).then(response => setUserInfo(response))
    }, [username]);

    useEffect(() => {
        // Wait for userInfo to be populated
        if (userInfo === undefined) return;

        // Used to show loading text on chart area
        setChartHasLoaded(false)

        const startingUnixSeconds = userInfo.registered['#text'];

        const numberOfScrobblePeriods = 15;
        const scrobblingPeriods = generateScrobblingPeriods(startingUnixSeconds, numberOfScrobblePeriods);

        // Populating chart with time periods
        setChartOptions({
            ...chartOptions,
            plotOptions: {
                series: {
                    pointStart: userInfo.registered['#text'] * 1000,
                    pointInterval: (Date.now() - (userInfo.registered['#text'] * 1000)) / numberOfScrobblePeriods,
                }
            },
        });

        // Get scrobbling data from last.fm API for each period
        getScrobblingDataForAllPeriods(username, scrobblingPeriods, dataSource)
            .then(response => {
                setScrobblingData(createScrobblingDataObjects(response))
            })
    },[userInfo, dataSource]);

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
        return formattedScrobblingData;
    };

    const generateScrobblingPeriods = (startingUnix, numberOfScrobblePeriods) => {
        const currentUnixSeconds = Date.now() / 1000;
        const periodLengthSeconds = Math.floor((currentUnixSeconds - startingUnix)/numberOfScrobblePeriods); //Max limit of scrobbling periods to prevent API overload

        let scrobblingPeriods = [];
        
        // Generate "from" and "to" unix timestamps for api requests
        for (let scrobblingPeriod = startingUnix; scrobblingPeriod < currentUnixSeconds; scrobblingPeriod += periodLengthSeconds) {

            let fromUnix = scrobblingPeriod;
            let toUnix = scrobblingPeriod + periodLengthSeconds;

            scrobblingPeriods.push({
                fromUnix: fromUnix,
                toUnix: toUnix,
                fromDate: new Date(fromUnix * 1000).toUTCString(),
                toDate: new Date(toUnix * 1000).toUTCString()});
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

        setChartHasLoaded(true)

        return seriesData
    }

    // Reloads chart if scrobbling data source changes (artist, album, track)
    useEffect(() => {
        if (scrobblingData === undefined) return;

        setChartOptions({
            series: generateSeriesData()
        })

    }, [scrobblingData]);

    // Used to regenerate series data when chart settings changes
    useEffect(() => {
        console.log(stackingType)

        scrobblingData &&
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
                    ...prevOptions.series,
                    stacking: stackingType !== "overlap" ? stackingType : undefined
                }
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
    TODO: Options to choose the period (e.g. last year, last 3 months, etc.)
    TODO: Allow forecasting of data?
    TODO: Better feedback for loading and error handling
    TODO: Improve initial page for user and period input
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
                        dataSource={dataSource}
                        setDataSource={setDataSource}
                        hasLoaded={chartHasLoaded}
                        setUsername={setUsername}
                        currentInputUsername={currentInputUsername}
                        setCurrentInputUsername={setCurrentInputUsername}
                    />
                    <Box mt={3} ml={5} mr={5}>
                        <CustomDivider text={'Chart Settings'}/>
                        <HStack mb={2} justifyContent={'space-evenly'} alignItems={'center'}>
                            <Button fontSize={14} className={dataPresentationMode === 'cumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('cumulativeScrobbleData')}>Cumulative</Button>
                            <Button fontSize={14} className={dataPresentationMode === 'noncumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('noncumulativeScrobbleData')}>Non-cumulative</Button>
                            <Button fontSize={14} className={dataPresentationMode === 'periodRankingPositions' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('periodRankingPositions')}>Ranking</Button>
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
                                                            ...(prevOptions.navigator),
                                                            enabled: e.target.checked
                                                        },
                                                        scrollbar: {
                                                            ...(prevOptions.navigator),
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
                        <AutoComplete openOnFocus listAllValuesOnFocus={true} maxSuggestions={50} onChange={(val) => addToActiveItems(val)}>
                            <AutoCompleteInput variant={'outline'}/>
                            {
                                scrobblingData &&
                                <AutoCompleteList m={0} p={0}>
                                    {
                                        sortArrayByTotalScrobbles(scrobblingData).map((item, index) => {
                                            // Check if the current index is in the activeItems array
                                            const isDisabled = activeItems.includes(index);
                                            return (
                                                <AutoCompleteItem
                                                    key={`item${index}`}
                                                    value={item.name}
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
                                                                    {item.name} · <span style={{fontWeight: 'bold'}}>{item.totalScrobbles.toLocaleString()}</span>
                                                                </span>
                                                                :
                                                                <span>
                                                                    {item.name} · <span style={{fontWeight: 'bold'}}>{item.totalScrobbles.toLocaleString()}</span>
                                                                    <br/>
                                                                    <span style={{color: '#7285A5'}}>
                                                                        {item.artist}
                                                                    </span>
                                                                </span>
                                                        }
                                                    </span>

                                                </AutoCompleteItem>
                                            );
                                        })
                                    }
                                </AutoCompleteList>
                            }
                        </AutoComplete>
                        <HStack mt={2} mb={2} justifyContent={'space-between'}>
                            <Button onClick={() => clearSeriesData()} size={'sm'} w={'100%'}>Clear All</Button>
                            <Button onClick={() => resetSeriesData()} size={'sm'} w={'100%'}>Reset</Button>
                        </HStack>
                        {
                            scrobblingData &&
                            <Fade in={true}>
                                <Box display={'flex'} flexWrap={'wrap'} mt={2} mb={2}>
                                    {
                                        activeItems.map((item, index) => (
                                            <Tag
                                                m={1}
                                                key={item}
                                                borderRadius={'full'}
                                                variant={'solid'}
                                            >
                                                <Box borderRadius={'full'} bg={chartSeriesColours[index % chartSeriesColours.length]} w={4} h={4} ml={-1} mr={1}/>
                                                <TagLabel pb={1} pt={1}>{truncateText(scrobblingData[item].name)}</TagLabel>
                                                <TagCloseButton onClick={() => removeFromActiveItems(index)}/>
                                            </Tag>
                                        ))
                                    }
                                </Box>
                            </Fade>
                        }
                    </Box>
                </GridItem>
                <GridItem colSpan={5} mt={5} mr={5}>
                    {
                        scrobblingData !== undefined ?
                            <Fade in={true}>
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    constructorType={'stockChart'}
                                    options={chartOptions}
                                    containerProps={{ style: { height: '97vh' } }}
                                />
                            </Fade>
                            :
                            <HStack w={'100%'} h={'100vh'} justifyContent={'center'} alignItems={'center'}>
                                <Text>loading {user}'s {dataSource} chart</Text>
                                <Spinner/>
                            </HStack>
                    }
                </GridItem>
            </Grid>
        </Container>
    )
}

export {ChartPage}