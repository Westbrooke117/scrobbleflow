import {useNavigate} from "react-router-dom";
import {Button, Input, Container} from "@chakra-ui/react";
import {useState} from "react";

const UserInputPage = () => {
    const navigate = useNavigate();
    const [inputUsername, setInputUsername] = useState("");

    function handleClick(user) {
        navigate(`/chart/${user}`);
    }

    return (
        <>
            <Container>
                <Input type={'text'} variant={'filled'} onChange={(e) => {setInputUsername(e.target.value)}}/>
                <Button onClick={() => handleClick(inputUsername)}>View Charts for {inputUsername}</Button>
            </Container>
        </>
    )
}

export {UserInputPage}