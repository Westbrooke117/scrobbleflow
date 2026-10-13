import { useEffect, useState } from "react";
import { Box, Text, Flex, Checkbox, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from "@chakra-ui/react";
import { TrendingUp } from "lucide-react";
import { OptionsBoxHeading } from "./OptionsBoxHeading.jsx";
import { formatDuration } from "../../utils/helperFunctions.js";

const MIN_LOOKBACK = 5;

// e.g. "3 months (30 periods)", or just "30 periods" before the data has loaded
const describePeriods = (periods, pointInterval) => {
    const periodText = `${periods} ${periods === 1 ? 'period' : 'periods'}`;
    return pointInterval ? `${formatDuration(periods * pointInterval)} (${periodText})` : periodText;
};

export const ForecastingOptions = ({
    forecastingEnabled,
    setForecastingEnabled,
    forecastHistory,
    setForecastHistory,
    forecastLength,
    setForecastLength,
    showMarginOfError,
    setShowMarginOfError,
    pointInterval,
    availablePeriods,
    isUnavailable
}) => {
    // The sliders are controlled by local state so their labels update while dragging;
    // the chart only recalculates when a slider is released
    const maxLookback = Math.max(MIN_LOOKBACK, availablePeriods || 150);
    const [lookbackDraft, setLookbackDraft] = useState(Math.min(forecastHistory, maxLookback));
    const [lengthDraft, setLengthDraft] = useState(forecastLength);
    useEffect(() => setLookbackDraft(Math.min(forecastHistory, maxLookback)), [forecastHistory, maxLookback]);
    useEffect(() => setLengthDraft(forecastLength), [forecastLength]);

    return (
        <Box mb={2} mt={2}>
            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                <OptionsBoxHeading icon={TrendingUp}>Forecasting</OptionsBoxHeading>
                <hr />
                <Flex mt={1} alignItems="center">
                    <Text color={isUnavailable ? 'gray.500' : undefined}>Enable Forecasting</Text>
                    <Checkbox ml={2} isChecked={forecastingEnabled && !isUnavailable} isDisabled={isUnavailable} onChange={(e) => setForecastingEnabled(e.target.checked)} />
                </Flex>
                {isUnavailable && (
                    <Text fontSize={'sm'} color={'gray.400'}>Not available for rankings</Text>
                )}
                {forecastingEnabled && !isUnavailable && (
                    <>
                        <Box mt={1}>
                            <Text mt={1}>Based on the last {describePeriods(lookbackDraft, pointInterval)}</Text>
                            <Slider
                                value={lookbackDraft}
                                min={MIN_LOOKBACK}
                                max={maxLookback}
                                step={1}
                                onChange={setLookbackDraft}
                                onChangeEnd={setForecastHistory}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                        </Box>
                        <Box mt={1}>
                            <Text mt={1}>Forecast {describePeriods(lengthDraft, pointInterval)} ahead</Text>
                            <Slider
                                value={lengthDraft}
                                min={1}
                                max={50}
                                step={1}
                                onChange={setLengthDraft}
                                onChangeEnd={setForecastLength}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                        </Box>
                        <Flex mt={1} alignItems="center">
                            <Text>Show likely range</Text>
                            <Checkbox ml={2} isChecked={showMarginOfError} onChange={(e) => setShowMarginOfError(e.target.checked)} />
                        </Flex>
                    </>
                )}
            </Box>
        </Box>
    );
};
