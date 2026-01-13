import { Box, Text, Flex, Checkbox } from "@chakra-ui/react";

export const MiscellaneousOptions = ({
    alignedToFirstScrobble,
    toggleAlignedToFirstScrobble,
    navigatorEnabled,
    setNavigatorEnabled,
    legendEnabled,
    setLegendEnabled,
    saveToLocalStorage
}) => {
    return (
        <Box mb={2} mt={2}>
            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={2} borderRadius={5}>
                <Text fontSize={20} mb={1}>Miscellaneous</Text>
                <hr />
                <Flex mt={1} alignItems="center">
                    <Text>Align data to first scrobble</Text>
                    <Checkbox ml={2} isChecked={alignedToFirstScrobble} onChange={() => toggleAlignedToFirstScrobble()} />
                </Flex>
                <Flex mt={1} alignItems="center">
                    <Text>Show chart navigator</Text>
                    <Checkbox
                        ml={2}
                        isChecked={navigatorEnabled}
                        onChange={(e) => {
                            setNavigatorEnabled(e.target.checked);
                            saveToLocalStorage({ name: 'navigatorEnabled', value: e.target.checked });
                        }}
                    />
                </Flex>
                <Flex mt={1} alignItems="center">
                    <Text>Show chart legend</Text>
                    <Checkbox
                        isChecked={legendEnabled}
                        ml={2}
                        onChange={(e) => {
                            setLegendEnabled(e.target.checked);
                            saveToLocalStorage({ name: 'legendEnabled', value: e.target.checked });
                        }}
                    />
                </Flex>
            </Box>
        </Box>
    );
};
