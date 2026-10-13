import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, HStack, Button, Tag, TagLabel, TagCloseButton, Fade, Skeleton } from "@chakra-ui/react";
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

    // Scroll the pill box to the bottom when an entry is added, so the new pill is visible
    const pillContainerRef = useRef(null);
    const previousActiveItemCount = useRef(activeItems.length);
    useEffect(() => {
        if (activeItems.length > previousActiveItemCount.current && pillContainerRef.current) {
            pillContainerRef.current.scrollTop = pillContainerRef.current.scrollHeight;
        }
        previousActiveItemCount.current = activeItems.length;
    }, [activeItems.length]);

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

    // Skeleton mirrors the loaded layout (search box, buttons, selected entries box) so nothing jumps when it swaps in
    if (!scrobblingData || !chartHasLoaded) {
        return (
            <>
                <Skeleton h={10} borderRadius={'md'} />
                <HStack mt={2} mb={2}>
                    <Skeleton h={8} w={'100%'} borderRadius={'md'} />
                    <Skeleton h={8} w={'100%'} borderRadius={'md'} />
                </HStack>
                <Box bg={'gray.900'} borderRadius={5} mt={2} mb={2} p={2}>
                    <Skeleton h={3} w={'40%'} mx={1} mt={1} mb={3} />
                    <Box display={'flex'} flexWrap={'wrap'}>
                        {[90, 120, 70, 110, 80, 100].map((width, index) => (
                            <Skeleton key={index} h={6} w={`${width}px`} m={1} borderRadius={'full'} />
                        ))}
                    </Box>
                </Box>
            </>
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
                <Box bg={'gray.900'} borderRadius={5} mt={2} mb={2} p={2}>
                    <Text fontSize={'sm'} color={'gray.400'} px={1} mb={1}>
                        {`${activeItems.length} selected ${dataSource}${activeItems.length === 1 ? '' : 's'}`}
                    </Text>
                    {/* Capped at roughly three rows of pills; any more scroll inside the box */}
                    <Box
                        ref={pillContainerRef}
                        display={'flex'}
                        flexWrap={'wrap'}
                        maxH={'124px'}
                        overflowY={'auto'}
                        sx={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#4a5568 transparent'
                        }}
                    >
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
                </Box>
            </Fade>
        </>
    );
});

SeriesEntriesSearch.displayName = 'SeriesEntriesSearch';
