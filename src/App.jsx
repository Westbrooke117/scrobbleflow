import './App.css'
import {useEffect, useState} from "react";
import getUserInfo from "./getUserInfo.js";
import {getScrobblingDataForAllPeriods} from "./getScrobblingDataForAllPeriods.js";
import HighchartsReact from "highcharts-react-official";
import Highcharts from 'highcharts'

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

function App() {
  const [userInfo, setUserInfo] = useState();
  const [scrobblingData, setScrobblingData] = useState();
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [dataPresentationMode, setDataPresentationMode] = useState('cumulativeScrobbleData');
  const [chartType, setChartType] = useState('line');
  const [dataSmoothStrength, setDataSmoothStrength] = useState(1);

  const [chartOptions, setChartOptions] = useState(
      {
        chart: {
          type: chartType,
          height: '50%'
        },
        plotOptions: {
          line: {
            marker: {
              enabled: false
            }
          }
        },
        title: {
          text: ''
        },
        series: [{
          data: [],
        }]
      }
  );

  useEffect(() => {
    getUserInfo().then(response => setUserInfo(response))
  }, []);

  useEffect(() => {
    // Wait for userInfo to be populated
    if (userInfo === undefined) return;

    const startingUnix = userInfo.registered['#text'];
    const scrobblingPeriods = generateScrobblingPeriods(startingUnix);

    getScrobblingDataForAllPeriods(scrobblingPeriods)
        .then(response => setScrobblingData(formatScrobblingData(response)))
  },[userInfo]);

  useEffect(() => {
    if (scrobblingData === undefined) return;

    setChartOptions({
      ...chartOptions,
      series: {
        name:scrobblingData[activeItemIndex].name,
        data: scrobblingData[activeItemIndex][dataPresentationMode],
      },
      chart: {
        type: chartType,
      }
    })

    console.log(scrobblingData[activeItemIndex])
  },[scrobblingData, activeItemIndex, dataPresentationMode, chartType, dataSmoothStrength])

  return (
    <>
      <div>
        {
          scrobblingData &&
            <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
              <span>Viewing data for {userInfo.name} </span>
              <select onChange={(e) => setActiveItemIndex(e.target.value)}>
                {
                  scrobblingData.map((item, index) => (
                      <option value={index}>{item.name} - {item.totalScrobbles}</option>
                  ))
                }
              </select>
              <select onChange={(e) => setDataPresentationMode(e.target.value)}>
                <option value={"cumulativeScrobbleData"}>Cumulative</option>
                <option value={"noncumulativeScrobbleData"}>Non-cumulative</option>
                <option value={"periodRankingPositions"}>Ranking</option>
              </select>
              <select onChange={(e) => setChartType(e.target.value)}>
                <option value={"line"}>Line</option>
                <option value={"column"}>Column</option>
                <option value={"area"}>Area</option>
                <option value={"scatter"}>Scatter</option>
              </select>
            </div>
        }
      </div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions}/>
    </>
  )
}

export default App
