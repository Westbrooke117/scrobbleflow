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

const UserInfoAccordion = ({userInfo, setDataSource, setUsername, currentInputUsername, setCurrentInputUsername, setStartDate, setTimePeriod}) => {
    const navigate = useNavigate();
    const params = useParams();

    const [selectedDataSource, setSelectedDataSource] = useState(params.urlDataSource)
    const [selectedTimeRange, setSelectedTimeRange] = useState(params.timePeriod)
    const [inputValue, setInputValue] = useState(params.user)

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
                </AccordionPanel>
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
}

export { UserInfoAccordion }