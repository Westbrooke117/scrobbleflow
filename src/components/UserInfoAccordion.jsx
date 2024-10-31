import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Avatar, Box, Button,
    FormControl, FormLabel, HStack, Input, Select,
    Text
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import {useState} from "react";
import {useParams} from "react-router-dom";
import {useNavigate} from "react-router-dom";

const UserInfoAccordion = ({userInfo, dataSource, setDataSource, setUsername, currentInputUsername, setCurrentInputUsername}) => {
    const navigate = useNavigate();
    const [selectedDataSource, setSelectedDataSource] = useState(dataSource)

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
                        <HStack>
                            <Box w={'30%'}>
                                <FormLabel mb={1}>Data source</FormLabel>
                                <Select variant={'filled'} defaultValue={useParams().urlDataSource} onChange={(e) => setSelectedDataSource(e.target.value)}>
                                    <option value='artist'>Artists</option>
                                    <option value='album'>Albums</option>
                                    <option value='track'>Tracks</option>
                                </Select>
                            </Box>
                            <Box w={'50%'}>
                                <FormLabel mb={1}>User</FormLabel>
                                <Input onChange={(e) => setCurrentInputUsername(e.target.value)} defaultValue={useParams().user}/>
                            </Box>
                            <Box w={'20%'}>
                                <FormLabel mb={1}>‎ </FormLabel>
                                <Button onClick={() => {
                                    navigate(`/chart/${currentInputUsername}/${selectedDataSource}`)
                                    setUsername(currentInputUsername)
                                    setDataSource(selectedDataSource)
                                }}>Update</Button>
                            </Box>
                        </HStack>
                    </FormControl>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    )
}

UserInfoAccordion.propTypes = {
    userInfo: PropTypes.object.isRequired,
    dataSource: PropTypes.string.isRequired,
    setDataSource: PropTypes.func.isRequired,
    hasLoaded: PropTypes.bool.isRequired,
    setUsername: PropTypes.func.isRequired,
    currentInputUsername: PropTypes.string.isRequired,
    setCurrentInputUsername: PropTypes.func.isRequired,
}

export { UserInfoAccordion }