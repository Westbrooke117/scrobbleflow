import '../App.css'
import {useEffect, useRef, useState} from "react";
import getUserInfo from "../getUserInfo.js";
import {getScrobblingDataForAllPeriods} from "../getScrobblingDataForAllPeriods.js";
import HighchartsReact from "highcharts-react-official";
import Highcharts from 'highcharts'
import {
    HStack,
    Text,
    Select,
    Box,
    Container,
    Grid,
    GridItem,
    Avatar,
    Button,
    Tag,
    TagLabel,
    TagCloseButton,
    Checkbox,
    Switch,
    Slider,
    SliderTrack,
    SliderFilledTrack, SliderThumb, MenuButton, Input, Menu, MenuList, MenuItem, useDisclosure, Flex
} from "@chakra-ui/react";
import {useParams} from "react-router-dom";
import {CustomDivider} from "../components/CustomDivider.jsx";
import {AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList} from "@choc-ui/chakra-autocomplete";

class Artist {
    constructor(name){
        this.name = name;
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
    const {username} = useParams()

    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');
    const [smoothStrength, setSmoothStrength] = useState(0)

    const chartRef = useRef()

    const [chartOptions, setChartOptions] = useState(
        {
            chart: {
                type: chartType,
                backgroundColor: '#1a202c',
                height: '59%'
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
            legend: {
                itemStyle: {'color':'#eeefef'}
            },
            title: {
                text: ''
            },
            xAxis: {
                labels: {
                    style: {
                        color: "#b1b1b1"
                    }
                }
            },
            yAxis: {
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

    const formatScrobblingData = (scrobblingData) => {
        let listOfItemNames = [];

        // Note "item" in this context refers to either an artist, album, or track

        scrobblingData.map(period => {
            period.map(item => {
                if (listOfItemNames.includes(item.name)){
                    // Ignore
                } else {
                    listOfItemNames.push(item.name)
                }
            })
        })

        let formattedScrobblingData = [];

        listOfItemNames.map(itemName => {
            let item = new Artist(itemName)
            item.calculateTotalScrobbles(scrobblingData)
            item.calculateLongitudinalData(scrobblingData)

            formattedScrobblingData.push(item);
        })

        return formattedScrobblingData;
    }

    const formatDate = (unixTimestamp) => {
        let date = new Date(unixTimestamp * 1000)

        let month = date.toLocaleString('default', { month: 'long' });
        let year = date.getFullYear();

        return `${month} ${year}`
    }

    const generateScrobblingPeriods = (startingUnix) => {
        const endingUnix = Date.now() / 1000;
        const weekInSeconds = 604800;

        let scrobblingPeriods = [];
        
        //Generate "from" and "to" unix timestamps for api requests
        for (let scrobblingPeriod = startingUnix; scrobblingPeriod < endingUnix; scrobblingPeriod += weekInSeconds) {
            let fromUnix = scrobblingPeriod;
            let toUnix = scrobblingPeriod + weekInSeconds;

            scrobblingPeriods.push({
                fromUnix: fromUnix,
                toUnix: toUnix,
                fromDate: new Date(fromUnix * 1000).toUTCString(),
                toDate: new Date(toUnix * 1000).toUTCString()});
        }
        return scrobblingPeriods;
    }

    useEffect(() => {
        getUserInfo(username).then(response => setUserInfo(response))
    }, []);

    useEffect(() => {
        // Wait for userInfo to be populated
        if (userInfo === undefined) return;

        const startingUnix = userInfo.registered['#text'];
        const scrobblingPeriods = generateScrobblingPeriods(startingUnix);

        getScrobblingDataForAllPeriods(username, scrobblingPeriods)
            .then(response => {
                setScrobblingData(formatScrobblingData(response))
            })
    },[userInfo]);

    const deepCopy = (obj) => {
        return JSON.parse(JSON.stringify(obj));
    }

    const getSeriesData = () => {
        let seriesData = [];
        const scrobblingDataCopy = deepCopy(scrobblingData);

        if (smoothStrength > 0){
            activeItems.map(item => {
                seriesData.push(
                    {
                        name: scrobblingDataCopy[item].name,
                        data: getSmoothedValues(smoothStrength, item)
                    }
                )
            })
        } else {
            activeItems.map(item => {
                seriesData.push(
                    {
                        name: scrobblingDataCopy[item].name,
                        data: scrobblingDataCopy[item][dataPresentationMode],
                    }
                )
            })
        }
        return seriesData
    }

    useEffect(() => {
        if (scrobblingData === undefined) return;

        setChartOptions({
            xAxis: {
                categories: generateScrobblingPeriods(userInfo.registered['#text']).map(period => (formatDate(period.fromUnix)))
            },
            series: getSeriesData()
        })
    }, [scrobblingData]);

    const updateChartSeries = () => {
        setChartOptions({
            series: getSeriesData(),
            chart: {
                type: chartType
            }
        })
    }

    useEffect(() => {
        scrobblingData &&

        updateChartSeries()
    },[dataPresentationMode, chartType, activeItems, smoothStrength])

    const sortArray = (array) => {
        return array.sort((a, b) => b.totalScrobbles - a.totalScrobbles);
    }

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

    const getSmoothedValues = (smoothStrength, index) => {
        let scrobbleDataCopy = [...scrobblingData];
        let smoothedData = []

        let series = scrobbleDataCopy[index][dataPresentationMode];

        for (let i = 0; i < series.length; i++){
            switch (smoothStrength){
                case 1:
                    smoothedData.push(
                        Math.round((series[i-1] + series[i] + series[i+1])/3)
                    )
                    break;
                case 2:
                    smoothedData.push(
                        Math.round((series[i-2] + series[i-1] + series[i] + series[i+1] + series[i+2])/5)
                    )
                    break;
                case 3:
                    smoothedData.push(
                        Math.round((series[i-3] + series[i-2] + series[i-1] + series[i] + series[i+1] + series[i+2] + series[i+3])/7)
                    )
                    break;
            }
        }
        return smoothedData
    }

    const getSmoothingLabel = () => {
        if (smoothStrength === 0) return "No smoothing (real data)"
        if (smoothStrength === 1) return "3-point smoothing"
        if (smoothStrength === 2) return "5-point smoothing"
        if (smoothStrength === 3) return "7-point smoothing"
    }

    const { isOpen, onOpen, onClose } = useDisclosure()

    return (
        <Container maxW={'100%'} p={0} m={0}>
            <Grid templateColumns={'repeat(6,1fr)'}>
                <GridItem colSpan={1}>
                    {
                        scrobblingData &&
                        <>
                            <HStack alignItems={'center'} justifyContent={'center'} backgroundColor={'gray.900'} pt={2} pb={2}>
                                <Avatar src={userInfo.image[0]['#text']} size={'sm'}/>
                                <Text>{userInfo.name}'s last.fm Data</Text>
                            </HStack>
                            <Box mt={3} ml={5} mr={5}>
                                <CustomDivider text={'Chart Settings'}/>
                                <HStack mb={2} justifyContent={'space-evenly'} alignItems={'center'}>
                                    <Button fontSize={14} className={dataPresentationMode === 'cumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('cumulativeScrobbleData')}>Cumulative</Button>
                                    <Button fontSize={14} className={dataPresentationMode === 'noncumulativeScrobbleData' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('noncumulativeScrobbleData')}>Non-cumulative</Button>
                                    <Button fontSize={14} className={dataPresentationMode === 'periodRankingPositions' && 'option-button'} w={'100%'} onClick={() => setDataPresentationMode('periodRankingPositions')}>Ranking</Button>
                                </HStack>
                                <Select mb={3} variant={'filled'} maxW={'100%'}
                                        onChange={(e) => setChartType(e.target.value)}>
                                    <option value={"line"}>Line</option>
                                    <option value={"column"}>Column</option>
                                    <option value={"area"}>Area</option>
                                    <option value={"scatter"}>Scatter</option>
                                    <option value={"spline"}>Smooth line</option>
                                </Select>
                                <CustomDivider text={'Visualisation Options'}/>
                                <Box mt={2} mb={2}>
                                    <Text>Data smoothing: <span style={{fontWeight: 'bold'}}>{getSmoothingLabel()}</span></Text>
                                    <Slider defaultValue={0} min={0} max={3} onChange={(val) => setSmoothStrength(val)}>
                                        <SliderTrack>
                                            <SliderFilledTrack />
                                        </SliderTrack>
                                        <SliderThumb />
                                    </Slider>
                                    <Flex>
                                        <Text>Show raw data with smoothed</Text>
                                        <Checkbox ml={2}/>
                                    </Flex>
                                </Box>
                                <CustomDivider text={'Series Entries'}/>
                                <AutoComplete openOnFocus listAllValuesOnFocus={true} maxSuggestions={50} onChange={(val) => addToActiveItems(val)}>
                                    <AutoCompleteInput variant={'outline'}/>
                                    <AutoCompleteList m={0} p={0}>
                                        {
                                            sortArray(scrobblingData).map((item, index) => (
                                                <AutoCompleteItem key={`item${index}`} value={item.name} whiteSpace={'nowrap'} p={1} pl={3} m={0}>
                                                    <span>{item.name} · </span>
                                                    <span style={{fontWeight:'bold', marginLeft:'4px'}}>{item.totalScrobbles}</span>
                                                </AutoCompleteItem>
                                            ))
                                        }
                                    </AutoCompleteList>
                                </AutoComplete>
                                <HStack mt={2} mb={2} justifyContent={'space-between'}>
                                    <Button onClick={() => clearSeriesData()} size={'sm'} w={'100%'}>Clear All</Button>
                                    <Button onClick={() => resetSeriesData()} size={'sm'} w={'100%'}>Reset</Button>
                                </HStack>
                                <Box display={'flex'} flexWrap={'wrap'} mt={2}>
                                    {
                                        activeItems.map((item, index) => (
                                            <Tag
                                                m={1}
                                                key={item}
                                                borderRadius={'full'}
                                                variant={'solid'}
                                            >
                                                <TagLabel pb={1} pt={1}>{scrobblingData[item].name}</TagLabel>
                                                <TagCloseButton onClick={() => removeFromActiveItems(index)}/>
                                            </Tag>
                                        ))
                                    }
                                </Box>
                            </Box>
                        </>
                    }
                </GridItem>
                <GridItem colSpan={5} mt={5}>
                    <HighchartsReact ref={chartRef} highcharts={Highcharts} options={chartOptions}/>
                </GridItem>
            </Grid>
        </Container>
    )
}

export {ChartPage}