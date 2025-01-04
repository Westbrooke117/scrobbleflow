import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Avatar, Box, Button,
    FormControl, FormLabel, HStack, Input, InputGroup, InputLeftAddon, Select,
    Text
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import {useState} from "react";
import {useParams} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {convertTimePeriodToFullDescription, getStartDateFromTimePeriod} from "../utils/helperFunctions.js";

const UserInfoAccordion = ({userInfo, setDataSource, setUsername, currentInputUsername, setCurrentInputUsername, setStartDate}) => {
    const navigate = useNavigate();

    const [selectedDataSource, setSelectedDataSource] = useState(useParams().urlDataSource)
    const [selectedTimeRange, setSelectedTimeRange] = useState(useParams().timePeriod)

    return (
        <Accordion allowToggle={true}>
            <AccordionItem bg={'gray.900'}>
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
                <AccordionPanel pb={2}>
                    <FormControl>
                        <InputGroup mb={2}>
                            <InputLeftAddon>User</InputLeftAddon>
                            <Input onChange={(e) => setCurrentInputUsername(e.target.value)} defaultValue={useParams().user}/>
                        </InputGroup>
                        <HStack justifyContent={'space-evenly'}>
                            <Select variant={'filled'} defaultValue={useParams().urlDataSource} onChange={(e) => setSelectedDataSource(e.target.value)}>
                                <option value='artist'>Artists</option>
                                <option value='album'>Albums</option>
                                <option value='track'>Tracks</option>
                            </Select>
                            <Select variant={'filled'} defaultValue={useParams().timePeriod} onChange={(e) => setSelectedTimeRange(e.target.value)}>
                                <option value='overall'>All time</option>
                                <option value='lastyear'>Last 365 days</option>
                                <option value='6month'>Last 180 days</option>
                                <option value='3month'>Last 90 days</option>
                                <option value='lastmonth'>Last 30 days</option>
                            </Select>
                            <Button colorScheme={'blue'} pl={7} pr={7} onClick={() => {
                                navigate(`/chart/${currentInputUsername}/${selectedDataSource}/${selectedTimeRange}`)
                                setUsername(currentInputUsername)
                                setDataSource(selectedDataSource)
                                if (selectedTimeRange === 'overall') {
                                    setStartDate(Math.floor(userInfo.registered['#text']));
                                } else {
                                    setStartDate(Math.floor((getStartDateFromTimePeriod(selectedTimeRange) / 1000)));
                                }
                            }}>Update</Button>
                        </HStack>
                    </FormControl>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    )
}

UserInfoAccordion.propTypes = {
    setStartDate: PropTypes.func.isRequired,
    userInfo: PropTypes.object.isRequired,
    setDataSource: PropTypes.func.isRequired,
    hasLoaded: PropTypes.bool.isRequired,
    setUsername: PropTypes.func.isRequired,
    currentInputUsername: PropTypes.string.isRequired,
    setCurrentInputUsername: PropTypes.func.isRequired,
}

export { UserInfoAccordion }