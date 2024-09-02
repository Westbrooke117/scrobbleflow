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
    Container, Grid, GridItem, Avatar, Button, Tag, TagLabel, TagCloseButton
} from "@chakra-ui/react";
import {useParams} from "react-router-dom";
import {CustomDivider} from "../components/CustomDivider.jsx";

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
    const [activeItems, setActiveItems] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
    const [chartType, setChartType] = useState('line');

    const chartRef = useRef()

    const [chartOptions, setChartOptions] = useState(
        {
            chart: {
                type: chartType,
                backgroundColor: '#1a202c',
                height: '70%'
            },
            plotOptions: {
                line: {
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

        let day = date.getDay()
        let dayOfWeek;

        switch (day) {
            case 0:
                dayOfWeek = "Mon"
                break;
            case 1:
                dayOfWeek = "Tue"
                break;
            case 2:
                dayOfWeek = "Wed"
                break;
            case 3:
                dayOfWeek = "Thu"
                break;
            case 4:
                dayOfWeek = "Fri"
                break;
            case 5:
                dayOfWeek = "Sat"
                break;
            case 6:
                dayOfWeek = "Sun"
                break;
        }

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

    const getSeriesData = (noOfSeries) => {
        let seriesData = [];
        const scrobblingDataCopy = deepCopy(scrobblingData);

        for (let i = 0; i < noOfSeries; i++){
            seriesData.push(
                {
                    name: scrobblingDataCopy[i].name,
                    data: scrobblingDataCopy[i][dataPresentationMode],
                }
            )
        }

        return seriesData
    }

    useEffect(() => {
        if (scrobblingData === undefined) return;

        setChartOptions({
            xAxis: {
                categories: generateScrobblingPeriods(userInfo.registered['#text']).map(period => (formatDate(period.fromUnix)))
            },
            series: getSeriesData(10)
        })
    }, [scrobblingData]);

    const updateChartSeries = () => {
        setChartOptions({
            series: getSeriesData(10),
            chart: {
                type: chartType
            }
        })
    }

    useEffect(() => {
        scrobblingData &&

        updateChartSeries()
    },[dataPresentationMode, chartType])

    const sortArray = (array) => {
        return array.sort((a, b) => b.totalScrobbles - a.totalScrobbles);
    }

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
                                <HStack mb={2} justifyContent={'space-between'} alignItems={'center'}>
                                    <Button w={'100%'} onClick={() => setDataPresentationMode('cumulativeScrobbleData')}>Cumulative</Button>
                                    <Button w={'100%'} onClick={() => setDataPresentationMode('noncumulativeScrobbleData')}>Non-cumulative</Button>
                                    <Button w={'100%'} onClick={() => setDataPresentationMode('periodRankingPositions')}>Ranking</Button>
                                </HStack>
                                <Select mb={3} variant={'filled'} maxW={'100%'} onChange={(e) => setChartType(e.target.value)}>
                                    <option value={"line"}>Line</option>
                                    <option value={"column"}>Column</option>
                                    <option value={"area"}>Area</option>
                                    <option value={"scatter"}>Scatter</option>
                                </Select>
                                <CustomDivider text={'Series Entries'}/>
                                <Select variant={'filled'} maxW={'100%'}>
                                    {
                                        sortArray(scrobblingData).map((item, index) => (
                                            <option value={index}>{item.name}</option>
                                        ))
                                    }
                                </Select>
                                <Box display={'flex'} flexWrap={'wrap'} mt={2}>
                                    {
                                        activeItems.map((item) => (
                                            <Tag
                                                m={1}
                                                key={item}
                                                borderRadius={'full'}
                                                variant={'solid'}
                                            >
                                                <TagLabel pb={1} pt={1}>{scrobblingData[item].name}</TagLabel>
                                                <TagCloseButton />
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