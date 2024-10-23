import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Avatar, Button,
    FormControl, FormLabel, HStack, Input,
    Text
} from "@chakra-ui/react";
import {DataSourceButton} from "./DataSourceButton.jsx";
import PropTypes from "prop-types";

const UserInfoAccordion = ({userInfo, dataSource, setDataSource, hasLoaded, setUsername, currentInputUsername, setCurrentInputUsername}) => {
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
                <AccordionPanel pb={4}>
                    <FormControl>
                        <FormLabel>Change data source</FormLabel>
                        <HStack justifyContent={'space-evenly'} alignItems={'center'} mb={2}>
                            <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} buttonDataSource={'artist'} buttonText={'Artists'} hasLoaded={hasLoaded}/>
                            <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} buttonDataSource={'album'} buttonText={'Albums'} hasLoaded={hasLoaded}/>
                            <DataSourceButton activeDataSource={dataSource} setDataSource={setDataSource} buttonDataSource={'track'} buttonText={'Tracks'} hasLoaded={hasLoaded}/>
                        </HStack>
                        <FormLabel>Change user</FormLabel>
                        <HStack>
                            <Input onChange={(e) => setCurrentInputUsername(e.target.value)}/>
                            <Button pl={5} pr={5} onClick={() => setUsername(currentInputUsername)}>Submit</Button>
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