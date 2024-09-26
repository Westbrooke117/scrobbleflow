import '../App.css'
import {useEffect, useRef, useState} from "react";
import getUserInfo from "../getUserInfo.js";
import {getScrobblingDataForAllPeriods} from "../getScrobblingDataForAllPeriods.js";
import Highcharts, {setOptions} from 'highcharts/highstock'
import HighchartsReact from "highcharts-react-official";
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
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Flex,
    Fade,
    Spinner,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon, Input, FormControl, FormLabel
} from "@chakra-ui/react";
import {useParams} from "react-router-dom";
import {CustomDivider} from "../components/CustomDivider.jsx";
import {AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList} from "@choc-ui/chakra-autocomplete";
import {DataSourceButton} from "../components/DataSourceButton.jsx";

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
    const [userInfo, setUserInfo] = useState();
    const [scrobblingData, setScrobblingData] = useState();
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4]);
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');
    const [smoothStrength, setSmoothStrength] = useState(0)
    const [alignedToFirstScrobble, setAlignedToFirstScrobble] = useState(false)
    let colours = [ "#2caffe", "#544fc5", "#00e272", "#fe6a35", "#6b8abc", "#d568fb", "#2ee0ca", "#fa4b42", "#feb56a", "#91e8e1" ]

    const chartRef = useRef()

    const [currentInputUsername, setCurrentInputUsername] = useState("")

    const {user} = useParams()
    const [username, setUsername] = useState(user)

    const [hasLoaded, setHasLoaded] = useState(false)

    const [dataSource, setDataSource] = useState("artist")

    const [chartOptions, setChartOptions] = useState(
        {
            chart: {
                type: chartType,
                backgroundColor: '#1a202c',
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
                                        <span style="color: ${point.color}; font-size: 16px"> ${truncateText(point.series.name)}: ${point.y}</span>
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

    useEffect(() => {
        getUserInfo(username).then(response => setUserInfo(response))
    }, [username]);

    useEffect(() => {
        // Wait for userInfo to be populated
        if (userInfo === undefined) return;

        const startingUnix = userInfo.registered['#text'];
        const scrobblingPeriods = generateScrobblingPeriods(startingUnix);

        setChartOptions({
            ...chartOptions,
            plotOptions: {
                series: {
                    pointStart: userInfo.registered['#text'] * 1000,
                    pointInterval: (Date.now() - userInfo.registered['#text'] * 1000) / 200,
                }
            },
        });

        getScrobblingDataForAllPeriods(username, scrobblingPeriods, dataSource)
            .then(response => {
                setScrobblingData(formatScrobblingData(response))
            })
    },[userInfo, dataSource]);

    const truncateText = (text) => {
        const textCutoff = 17
        return text.length > textCutoff ? text.substring(0, textCutoff) + "..." : text
    }

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

    useEffect(() => {
        setHasLoaded(false)
    }, [dataSource]);

    const generateScrobblingPeriods = (startingUnix) => {
        const endingUnix = Date.now() / 1000;
        const periodLengthSeconds = Math.floor((endingUnix - startingUnix)/200); //Max limit of 200 scrobbling periods to prevent API overload

        let scrobblingPeriods = [];
        
        //Generate "from" and "to" unix timestamps for api requests
        for (let scrobblingPeriod = startingUnix; scrobblingPeriod < endingUnix; scrobblingPeriod += periodLengthSeconds) {

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

    const deepCopy = (obj) => {
        return JSON.parse(JSON.stringify(obj));
    }

    const getSeriesData = () => {
        const scrobblingDataCopy = deepCopy(scrobblingData);

        if (alignedToFirstScrobble){
            activeItems.map(item => {
                scrobblingDataCopy[item][dataPresentationMode] = getAlignedDataset(scrobblingDataCopy[item][dataPresentationMode])
            })
        }

        if (smoothStrength > 0){
            activeItems.map(item => {
                scrobblingDataCopy[item][dataPresentationMode] = smoothDataset(scrobblingDataCopy[item][dataPresentationMode])
            })
        }

        //Generate series array
        let seriesData = []

        activeItems.map((item, index) => {
            seriesData.push(
                {
                    name: scrobblingDataCopy[item].name,
                    data: scrobblingDataCopy[item][dataPresentationMode],
                    color: colours[index]
                }
            )
        })

        setHasLoaded(true)

        //Return array
        return seriesData
    }

    const getAlignedDataset = ([...dataset]) => {
        let alignedDataset = []

        for (let i = 0; i < dataset.length; i++) {
            if (dataset[i] !== 0) alignedDataset.push(dataset[i])
        }

        return alignedDataset
    }

    useEffect(() => {
        if (scrobblingData === undefined) return;

        setChartOptions({
            // xAxis: {
            //     categories: generateScrobblingPeriods(userInfo.registered['#text']).map(period => (formatDate(period.fromUnix)))
            // },
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
    },[dataPresentationMode, chartType, activeItems, smoothStrength, alignedToFirstScrobble])

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

    const changeSeriesAlignment = () => {
        alignedToFirstScrobble === true ? setAlignedToFirstScrobble(false) : setAlignedToFirstScrobble(true)
    }

    const smoothDataset = ([...dataset]) => {
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

    const getSmoothingLabel = () => {
        if (smoothStrength === 0) return "No smoothing (real data)"
        if (smoothStrength === 1) return "3-point smoothing"
        if (smoothStrength === 2) return "5-point smoothing"
        if (smoothStrength === 3) return "7-point smoothing"
    }


    /*
    TODO: Options to choose the period (e.g. last year, last 3 months, etc.)
    TODO: Allow forecasting of data?
    TODO: Better feedback for loading and error handling
    TODO: Improve initial page for user and period input
    TODO: Option to choose between artist/track/album
     */

    return (
        <Container maxW={'100%'} p={0} m={0}>
            <Grid templateColumns={'repeat(6,1fr)'} h={'100vh'}>
                <GridItem colSpan={1}>
                    <Accordion allowToggle={true}>
                        <AccordionItem bg={'gray.900'}>
                            <AccordionButton display={'flex'} alignItems={'center'} justifyContent={'center'}>
                                {
                                    userInfo !== undefined ?
                                        <>
                                            <Avatar src={userInfo.image[0]['#text']} size={'sm'}/>
                                            <Text ml={3}>{userInfo.name}'s last.fm Data</Text>
                                        </>
                                        :
                                        <>
                                            <Avatar size={'sm'}/>
                                            <Text ml={3}>user's last.fm Data</Text>
                                        </>
                                }
                                <AccordionIcon ml={'auto'}/>
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <FormControl>
                                    <FormLabel>Change data source</FormLabel>
                                    <HStack justifyContent={'space-evenly'} alignItems={'center'} mb={2}>
                                        <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} dataSourceName={'artist'} buttonText={'Artists'} hasLoaded={hasLoaded}/>
                                        <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} dataSourceName={'album'} buttonText={'Albums'} hasLoaded={hasLoaded}/>
                                        <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} dataSourceName={'track'} buttonText={'Tracks'} hasLoaded={hasLoaded}/>
                                    </HStack>
                                    <FormLabel>Change user</FormLabel>
                                    <HStack>
                                        <Input onChange={(e) => setCurrentInputUsername(e.target.value)}/>
                                        <Button pl={5} pr={5} onClick={() => setUsername(currentInputUsername)}>Submit</Button>
                                    </HStack>
                                </FormControl>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>

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
                        <Box mb={2}>
                            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                                <Text fontSize={20} mb={1}>Data smoothing</Text>
                                <hr/>
                                <Text mt={1}>{getSmoothingLabel()}</Text>
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
                                        <Checkbox ml={2} onChange={() => changeSeriesAlignment()}/>
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
                                        sortArray(scrobblingData).map((item, index) => {
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
                                                    <span>{item.name} · </span>
                                                    <span style={{fontWeight:'bold', marginLeft:'4px'}}>{item.totalScrobbles}</span>
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
                                <Box display={'flex'} flexWrap={'wrap'} mt={2}>
                                    {
                                        activeItems.map((item, index) => (
                                            <Tag
                                                m={1}
                                                key={item}
                                                borderRadius={'full'}
                                                variant={'solid'}
                                            >
                                                <Box borderRadius={'full'} bg={colours[index % colours.length]} w={4} h={4} ml={-1} mr={1}/>
                                                <TagLabel pb={1} pt={1}>{scrobblingData[item].name}</TagLabel>
                                                <TagCloseButton onClick={() => removeFromActiveItems(index)}/>
                                            </Tag>
                                        ))
                                    }
                                </Box>
                            </Fade>
                        }
                    </Box>
                </GridItem>
                <GridItem colSpan={5} mt={5}>
                    {
                        scrobblingData !== undefined ?
                            <Fade in={true}>
                                <HighchartsReact 
                                    ref={chartRef} 
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