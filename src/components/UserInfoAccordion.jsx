import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    Avatar, Box, Button,
    FormControl, FormLabel, HStack, Input, InputGroup, InputLeftAddon, Select,
    Text
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import {useState} from "react";
import {motion} from "framer-motion";
import {useParams} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {convertTimePeriodToFullDescription, getStartDateFromTimePeriod} from "../utils/helperFunctions.js";

// Slides the panel down into view with an expo ease-out (launches fast, then decelerates hard into place).
// Closing slides it back up with a quick cubic ease-out. It's hidden once closed so it can't be tabbed to.
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1];
const panelSlideVariants = {
    open: { y: 0, visibility: 'visible', transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
    closed: { y: '-100%', transition: { duration: 0.2, ease: EASE_OUT_CUBIC }, transitionEnd: { visibility: 'hidden' } }
};

const UserInfoAccordion = ({userInfo, setDataSource, setUsername, currentInputUsername, setCurrentInputUsername, setStartDate, setTimePeriod, isOpen, onOpenChange}) => {
    const navigate = useNavigate();
    const params = useParams();

    const [selectedDataSource, setSelectedDataSource] = useState(params.urlDataSource)
    const [selectedTimeRange, setSelectedTimeRange] = useState(params.timePeriod)
    const [inputValue, setInputValue] = useState(params.user)

    return (
        <Accordion allowToggle={true} index={isOpen ? 0 : -1} onChange={(expandedIndex) => onOpenChange(expandedIndex === 0)}>
            <AccordionItem bg={'gray.900'} position={'relative'}>
                <AccordionButton display={'flex'} alignItems={'center'} justifyContent={'center'}>
                    {
                        userInfo !== undefined ?
                            // User data has loaded
                            <>
                                <Avatar src={userInfo.image[0]['#text']} size={'sm'}/>
                                <Text ml={3}>{userInfo.name}'s last.fm Data</Text>
                            </>
                            :
                            // User data is loading
                            <>
                                <Avatar size={'sm'}/>
                                <Text ml={3}>user's last.fm Data</Text>
                            </>
                    }
                    <AccordionIcon ml={'auto'}/>
                </AccordionButton>
                {/* The panel floats over the sidebar content below instead of pushing it down. It slides down
                    from under this row; the wrapper clips it while it's moving (with room below for the shadow).
                    Chakra's AccordionPanel isn't used because its height animation doesn't run with framer-motion 11. */}
                <Box position={'absolute'} top={'100%'} left={0} right={0} zIndex={2} overflow={'hidden'} pb={'16px'} pointerEvents={'none'}>
                    <motion.div
                        initial={false}
                        animate={isOpen ? 'open' : 'closed'}
                        variants={panelSlideVariants}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <Box bg={'gray.900'} px={4} pt={2} pb={2} boxShadow={'0 8px 16px rgba(0, 0, 0, 0.4)'}>
                            <FormControl>
                                <InputGroup mb={2}>
                                    <InputLeftAddon>User</InputLeftAddon>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </InputGroup>
                                <HStack justifyContent={'space-evenly'}>
                                    <Select variant={'filled'} defaultValue={params.urlDataSource} onChange={(e) => setSelectedDataSource(e.target.value)}>
                                        <option value='artist'>Artists</option>
                                        <option value='album'>Albums</option>
                                        <option value='track'>Tracks</option>
                                    </Select>
                                    <Select variant={'filled'} defaultValue={params.timePeriod} onChange={(e) => setSelectedTimeRange(e.target.value)}>
                                        <option value='overall'>All time</option>
                                        <option value='lastyear'>Last 365 days</option>
                                        <option value='6month'>Last 180 days</option>
                                        <option value='3month'>Last 90 days</option>
                                        <option value='lastmonth'>Last 30 days</option>
                                    </Select>
                                    <Button colorScheme={'blue'} pl={7} pr={7} onClick={() => {
                                        onOpenChange(false)
                                        navigate(`/chart/${inputValue}/${selectedDataSource}/${selectedTimeRange}`)
                                        setCurrentInputUsername(inputValue)
                                        setUsername(inputValue)
                                        setDataSource(selectedDataSource)
                                        setTimePeriod(selectedTimeRange)
                                        if (selectedTimeRange === 'overall') {
                                            if (userInfo?.registered?.['#text']) {
                                                setStartDate(Math.floor(userInfo.registered['#text']));
                                            }
                                        } else {
                                            setStartDate(Math.floor((getStartDateFromTimePeriod(selectedTimeRange) / 1000)));
                                        }
                                    }}>Update</Button>
                                </HStack>
                            </FormControl>
                        </Box>
                    </motion.div>
                </Box>
            </AccordionItem>
        </Accordion>
    )
}

UserInfoAccordion.propTypes = {
    setStartDate: PropTypes.func.isRequired,
    setTimePeriod: PropTypes.func.isRequired,
    userInfo: PropTypes.object,
    setDataSource: PropTypes.func.isRequired,
    hasLoaded: PropTypes.bool.isRequired,
    setUsername: PropTypes.func.isRequired,
    currentInputUsername: PropTypes.string.isRequired,
    setCurrentInputUsername: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
}

export { UserInfoAccordion }