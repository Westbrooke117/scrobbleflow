import {useNavigate} from "react-router-dom";
import {Button, Input, Container, Box, HStack, Text, Fade, Heading} from "@chakra-ui/react";
import {useState} from "react";

const UserInputPage = () => {
    const navigate = useNavigate();
    const [inputUsername, setInputUsername] = useState("");

    function handleClick(user) {
        navigate(`/chart/${user}`);
    }

    return (
        <>
            <Container justifyContent={'center'} alignItems={'center'} display={'flex'} width={"100vw"} height={"100vh"}>
                <Box>
                    <Heading mb={2}>ScrobbleFlow</Heading>
                    <hr/>
                    <HStack whiteSpace={'nowrap'}>
                        <Text fontSize={24}>last.fm/user/</Text>
                        <Input color={'#90cdf4'} ml={-1.5} placeholder={'last.fm username...'} fontSize={24} minW={'fit-content'} type={'text'} variant={'unstyled'} onChange={(e) => {setInputUsername(e.target.value)}}/>
                    </HStack>
                    {
                        inputUsername ?
                        <Fade in={true}>
                            <HStack justifyContent={'center'}>
                                <Button
                                    variant={'ghost'}
                                    minW={'fit-content'}
                                    onClick={() => handleClick(inputUsername)}
                                >View Charts</Button>
                            </HStack>
                        </Fade>
                            :
                        <Box h={10}/>
                    }
                </Box>
            </Container>
        </>
    )
}

export {UserInputPage}