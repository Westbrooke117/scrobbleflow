import {useNavigate} from "react-router-dom";
import {Button, Input, Container, Box, HStack, Text, Fade, Heading, VStack} from "@chakra-ui/react";
import {useState} from "react";

const UserInputPage = () => {
    const navigate = useNavigate();
    const [inputUsername, setInputUsername] = useState("");

    function handleClick(user) {
        navigate(`/chart/${user}`);
    }

    return (
        <>
            <Container justifyContent={'center'} alignItems={'center'} display={'flex'} width={"100vw"} height={"100vh"} gap={5}>
                <Box>
                    <Heading>ScrobbleFlow</Heading>
                    <HStack whiteSpace={'nowrap'}>
                        <Text fontSize={24}>last.fm/user/</Text>
                        <Input mt={0.5} color={'#90cdf4'} ml={-1.5} placeholder={'last.fm username...'} fontSize={24} minW={'fit-content'} type={'text'} variant={'flushed'} onChange={(e) => {setInputUsername(e.target.value)}}/>
                        <Fade in={inputUsername !== ""}>
                            <HStack justifyContent={'center'}>
                                <Button
                                    variant={'outline'}
                                    minW={'fit-content'}
                                    onClick={() => handleClick(inputUsername)}
                                >View Charts</Button>
                            </HStack>
                        </Fade>
                    </HStack>
                    <Box mt={10} textAlign={'left'} border={'1px solid #3f444e'} p={3} borderRadius={10}>
                        <Text fontWeight={'bold'} color={'gray.400'}>Created by Westbrooke117</Text>
                        <Text color={'gray.400'}>If you enjoy this tool please consider leaving a small donation or a shout on my last.fm profile. Thank you for your support :)</Text>
                        <HStack mt={2}>
                            <Button onClick={() => window.open('https://www.last.fm/user/Westbrooke117', "_blank")} colorScheme={'red'} variant={'ghost'}>My last.fm</Button>
                            <Button onClick={() => window.open('https://buymeacoffee.com/westbrooke117', "_blank")} colorScheme={'yellow'} variant={'ghost'}>Buy me a coffee</Button>
                        </HStack>
                    </Box>
                </Box>
            </Container>
        </>
    )
}

export {UserInputPage}