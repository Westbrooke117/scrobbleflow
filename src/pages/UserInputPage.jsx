import {useNavigate} from "react-router-dom";
import {
    Button,
    Input,
    Container,
    Box, 
    HStack,
    Text,
    Heading,
    VStack,
    Image,
    Select
} from "@chakra-ui/react";
import {useState} from "react";

import ReactGA from "react-ga4";
ReactGA.initialize("G-F7YB9324QD");

const UserInputPage = () => {
    const navigate = useNavigate();
    const [inputUsername, setInputUsername] = useState("");
    const [dataSourceOption, setDataSourceOption] = useState("artist")
    const [timePeriod, setTimePeriod] = useState("overall")

    const handleClick = (user) => {
        navigate(`/chart/${user}/${dataSourceOption}/${timePeriod}`);
    }

    return (
        <>
            <Container justifyContent={'center'} display={'flex'} width={"100vw"} height={"100vh"} gap={5}>
                <VStack justifyContent={'space-between'}>
                    <Box></Box>
                    <Box as="form" onSubmit={(e) => {
                        e.preventDefault();
                        if (inputUsername.trim().length > 0) {
                            handleClick(inputUsername.trim());
                        }
                    }}>
                        <HStack alignItems={'center'} mb={5} ml={-4}>
                            <Image src={'assets/icon.svg'} maxH={65} borderRadius={10}/>
                            <Box>
                                <Heading>ScrobbleFlow</Heading>
                                <Text whiteSpace={'nowrap'} color={'gray.500'}>Interactive and dynamic charts of your last.fm listening history</Text>
                            </Box>
                        </HStack>
                        <HStack whiteSpace={'nowrap'}>
                            <Text fontSize={24}>last.fm/user/</Text>
                            <Input
                                mt={0.5}
                                color={'#90cdf4'}
                                ml={-1.5}
                                placeholder={'last.fm username...'}
                                fontSize={24}
                                minW={'fit-content'}
                                type={'text'}
                                variant={'flushed'}
                                value={inputUsername}
                                onChange={(e) => {setInputUsername(e.target.value)}}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && inputUsername.trim().length > 0) {
                                        handleClick(inputUsername.trim());
                                    }
                                }}
                            />
                        </HStack>
                        <HStack mt={3}>
                            <Select variant={'filled'} onChange={(e) => setDataSourceOption(e.target.value)}>
                                <option value='artist'>Artists</option>
                                <option value='album'>Albums</option>
                                <option value='track'>Tracks</option>
                            </Select>
                            <Select variant={'filled'} onChange={(e) => setTimePeriod(e.target.value)}>
                                <option value='overall'>All time</option>
                                <option value='lastyear'>Last 365 days</option>
                                <option value='6month'>Last 180 days</option>
                                <option value='3month'>Last 90 days</option>
                                <option value='lastmonth'>Last 30 days</option>
                            </Select>
                            <Button
                                type="submit"
                                isDisabled={inputUsername.trim().length === 0}
                                variant={'outline'}
                                minW={'fit-content'}
                                onClick={() => handleClick(inputUsername.trim())}
                            >View Charts</Button>
                        </HStack>
                    </Box>
                    <Box mb={10} border={'1px solid #3f444e'} p={3} borderRadius={10}>
                        <Text fontWeight={'bold'} color={'gray.400'}>Created by Westbrooke117</Text>
                        <Text color={'gray.400'}>If you enjoy this tool please consider leaving a small donation or a shout on my last.fm profile. Thank you for your support :)</Text>
                        <HStack mt={2}>
                            <Button onClick={() => window.open('https://www.last.fm/user/Westbrooke117', "_blank")} colorScheme={'red'} variant={'ghost'}>My last.fm</Button>
                            <Button onClick={() => window.open('https://buymeacoffee.com/westbrooke117', "_blank")} colorScheme={'yellow'} variant={'ghost'}>Buy me a coffee</Button>
                        </HStack>
                    </Box>
                </VStack>
            </Container>
        </>
    )
}

export {UserInputPage}