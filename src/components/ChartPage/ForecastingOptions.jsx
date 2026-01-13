import { Box, Text, Flex, Checkbox, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from "@chakra-ui/react";

export const ForecastingOptions = ({
    forecastingEnabled,
    setForecastingEnabled,
    forecastHistory,
    setForecastHistory,
    forecastLength,
    setForecastLength,
    showMarginOfError,
    setShowMarginOfError,
    pointInterval
}) => {
    const intervalLabel = pointInterval === 86400000 ? 'days' : pointInterval === 604800000 ? 'weeks' : 'periods';

    return (
        <Box mb={2} mt={2}>
            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                <Text fontSize={20} mb={1}>Forecasting</Text>
                <hr />
                <Flex mt={1} alignItems="center">
                    <Text>Enable Forecasting</Text>
                    <Checkbox ml={2} isChecked={forecastingEnabled} onChange={(e) => setForecastingEnabled(e.target.checked)} />
                </Flex>
                {forecastingEnabled && (
                    <>
                        <Box mt={1}>
                            <Text mt={1}>History lookback: {forecastHistory} {intervalLabel}</Text>
                            <Slider defaultValue={forecastHistory} min={5} max={150} step={5} onChangeEnd={(val) => setForecastHistory(val)}>
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                        </Box>
                        <Box mt={1}>
                            <Text mt={1}>Forecast length: {forecastLength} {intervalLabel}</Text>
                            <Slider defaultValue={forecastLength} min={1} max={50} step={1} onChangeEnd={(val) => setForecastLength(val)}>
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                        </Box>
                        <Flex mt={1} alignItems="center">
                            <Text>Show Margin of Error</Text>
                            <Checkbox ml={2} isChecked={showMarginOfError} onChange={(e) => setShowMarginOfError(e.target.checked)} />
                        </Flex>
                    </>
                )}
            </Box>
        </Box>
    );
};
