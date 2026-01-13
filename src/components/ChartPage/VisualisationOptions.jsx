import { Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Flex, Checkbox } from "@chakra-ui/react";
import { getSmoothStrengthLabel } from "../../utils/chartUtils.js";

export const VisualificationOptions = ({
    smoothStrength,
    setSmoothStrength
}) => {
    return (
        <Box mb={2}>
            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                <Text fontSize={20} mb={1}>Data smoothing</Text>
                <hr />
                <Text mt={1}>{getSmoothStrengthLabel(smoothStrength)}</Text>
                <Slider defaultValue={0} min={0} max={3} onChange={(val) => setSmoothStrength(val)}>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
            </Box>
        </Box>
    );
};
