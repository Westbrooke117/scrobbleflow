import { Box, Text, HStack, Button, Tag, TagLabel, TagCloseButton, Fade } from "@chakra-ui/react";
import { AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList } from "@choc-ui/chakra-autocomplete";
import { sortArrayByTotalScrobbles } from "../../utils/chartUtils.js";
import { truncateText } from "../../utils/helperFunctions.js";

export const SeriesEntriesSearch = ({
    scrobblingData,
    chartHasLoaded,
    dataSource,
    activeItems,
    addToActiveItems,
    clearSeriesData,
    resetSeriesData,
    removeFromActiveItems,
    chartSeriesColours
}) => {
    if (!scrobblingData || !chartHasLoaded) {
        return (
            <Box textAlign="center" p={4}>
                <Text>Loading data...</Text>
            </Box>
        );
    }

    return (
        <>
            <AutoComplete openOnFocus listAllValuesOnFocus={true} maxSuggestions={50} onChange={(val) => addToActiveItems(val)}>
                <AutoCompleteInput placeholder={`Search for ${dataSource}...`} variant={'outline'} />
                <AutoCompleteList m={0} p={0}>
                    {
                        sortArrayByTotalScrobbles(scrobblingData).map((item, index) => {
                            const isDisabled = activeItems.includes(index);
                            const itemName = item?.name || 'Unknown';
                            const artistName = item?.artist || 'Unknown Artist';
                            const totalScrobbles = item?.totalScrobbles || 0;

                            return (
                                <AutoCompleteItem
                                    key={`item${index}`}
                                    value={itemName}
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
                                                    {truncateText(itemName, 40)} · <span style={{ fontWeight: 'bold' }}>{totalScrobbles.toLocaleString()}</span>
                                                </span>
                                                :
                                                <span>
                                                    {truncateText(itemName, 40)} · <span style={{ fontWeight: 'bold' }}>{totalScrobbles.toLocaleString()}</span>
                                                    <br />
                                                    <span style={{ color: '#7285A5' }}>
                                                        {truncateText(artistName, 40)}
                                                    </span>
                                                </span>
                                        }
                                    </span>
                                </AutoCompleteItem>
                            );
                        })
                    }
                </AutoCompleteList>
            </AutoComplete>
            <HStack mt={2} mb={2} justifyContent={'space-between'}>
                <Button onClick={() => clearSeriesData()} size={'sm'} w={'100%'}>Clear All</Button>
                <Button onClick={() => resetSeriesData()} size={'sm'} w={'100%'}>Reset</Button>
            </HStack>
            <Fade in={true}>
                <Box display={'flex'} flexWrap={'wrap'} mt={2} mb={2}>
                    {
                        activeItems.map((item, index) => {
                            const itemName = scrobblingData[item]?.name || 'Unknown';
                            return (
                                <Tag
                                    title={itemName.length > 17 ? itemName : ""}
                                    m={1}
                                    key={item}
                                    borderRadius={'full'}
                                    variant={'solid'}
                                >
                                    <Box borderRadius={'full'} bg={chartSeriesColours[index % chartSeriesColours.length]} w={4} h={4} ml={-1} mr={1} />
                                    <TagLabel pb={1} pt={1}>{truncateText(itemName)}</TagLabel>
                                    <TagCloseButton onClick={() => removeFromActiveItems(index)} />
                                </Tag>
                            )
                        })
                    }
                </Box>
            </Fade>
        </>
    );
};
