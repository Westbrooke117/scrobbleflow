import { HStack, Button, Select } from "@chakra-ui/react";

export const ChartSettings = ({ dataPresentationMode, setDataPresentationMode, setChartType, setStackingType }) => {
    return (
        <>
            <HStack mb={2} justifyContent={'space-evenly'} alignItems={'center'}>
                <Button
                    className={dataPresentationMode === 'cumulativeScrobbleData' ? 'option-button' : ''}
                    w={'100%'}
                    onClick={() => setDataPresentationMode('cumulativeScrobbleData')}
                >
                    Cumulative
                </Button>
                <Button
                    pl={6} pr={6}
                    className={dataPresentationMode === 'noncumulativeScrobbleData' ? 'option-button' : ''}
                    w={'100%'}
                    onClick={() => setDataPresentationMode('noncumulativeScrobbleData')}
                >
                    Non-cumulative
                </Button>
                <Button
                    className={dataPresentationMode === 'periodRankingPositions' ? 'option-button' : ''}
                    w={'100%'}
                    onClick={() => setDataPresentationMode('periodRankingPositions')}
                >
                    Ranking
                </Button>
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
        </>
    );
};
