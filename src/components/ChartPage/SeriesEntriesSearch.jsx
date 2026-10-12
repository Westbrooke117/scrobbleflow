import { memo, useMemo, useState } from "react";
import { Box, Text, HStack, Button, Tag, TagLabel, TagCloseButton, Fade } from "@chakra-ui/react";
import { AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList } from "@choc-ui/chakra-autocomplete";
import { truncateText } from "../../utils/helperFunctions.js";

// Bigram similarity (0-1), mirroring the fuzzy match in chakra-autocomplete's default filter
const bigramSimilarity = (a, b) => {
    if (!a?.length || !b?.length) return 0;
    const bigrams = (str) => {
        const padded = ` ${str.toLowerCase()} `;
        const result = [];
        for (let i = 0; i < padded.length - 1; i++) result.push(padded.slice(i, i + 2));
        return result;
    };
    const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
    const shorterBigrams = new Set(bigrams(shorter));
    const longerBigrams = bigrams(longer);
    let matches = 0;
    for (const bigram of longerBigrams) {
        if (shorterBigrams.delete(bigram)) matches++;
    }
    return matches / longerBigrams.length;
};

// Same as chakra-autocomplete's default filter, except an empty query matches nothing. Otherwise clearing
// the input renders every item while the list's close animation plays. Opening on focus still lists all
// items because listAllValuesOnFocus bypasses the filter.
const searchFilter = (query, value, label) => {
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    return value?.toLowerCase().includes(lowerQuery)
        || label?.toLowerCase().includes(lowerQuery)
        || bigramSimilarity(query, value) >= 0.5
        || bigramSimilarity(query, label) >= 0.5;
};

export const SeriesEntriesSearch = memo(({
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
    // Changing the AutoComplete's key remounts it, which clears the search input after a selection, Clear All or Reset
    const [searchResetKey, setSearchResetKey] = useState(0);

    // scrobblingData is already sorted by total scrobbles when it is created
    const autoCompleteItems = useMemo(() => {
        if (!scrobblingData) return null;
        const activeItemSet = new Set(activeItems);

        return scrobblingData.map((item, index) => {
            const itemName = item?.name || 'Unknown';
            const artistName = item?.artist || 'Unknown Artist';
            const totalScrobbles = item?.totalScrobbles || 0;

            return (
                <AutoCompleteItem
                    key={`item${index}`}
                    value={item?.id || itemName}
                    label={itemName}
                    whiteSpace={'nowrap'}
                    p={1}
                    pl={3}
                    m={0}
                    disabled={activeItemSet.has(index)}
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
        });
    }, [scrobblingData, activeItems, dataSource]);

    if (!scrobblingData || !chartHasLoaded) {
        return (
            <Box textAlign="center" p={4}>
                <Text>Loading data...</Text>
            </Box>
        );
    }

    return (
        <>
            <AutoComplete key={searchResetKey} openOnFocus listAllValuesOnFocus={true} maxSuggestions={50} emptyState={false} filter={searchFilter} onChange={(val) => { addToActiveItems(val); setSearchResetKey(key => key + 1); }}>
                <AutoCompleteInput placeholder={`Search for ${dataSource}...`} variant={'outline'} />
                <AutoCompleteList m={0} p={0}>
                    {autoCompleteItems}
                </AutoCompleteList>
            </AutoComplete>
            <HStack mt={2} mb={2} justifyContent={'space-between'}>
                <Button onClick={() => { clearSeriesData(); setSearchResetKey(key => key + 1); }} size={'sm'} w={'100%'}>Clear All</Button>
                <Button onClick={() => { resetSeriesData(); setSearchResetKey(key => key + 1); }} size={'sm'} w={'100%'}>Reset</Button>
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
});

SeriesEntriesSearch.displayName = 'SeriesEntriesSearch';
