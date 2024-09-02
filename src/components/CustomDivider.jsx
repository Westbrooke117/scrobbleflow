import {Box, HStack, Text} from "@chakra-ui/react";

const CustomDivider = ({text}) => {
    return (
        <HStack justifyItems={'center'} alignItems={'center'}>
            <Box w={'100%'} border={'1px dashed white'}/>
            <Text mb={1} textAlign={'center'} whiteSpace={'nowrap'}>{text}</Text>
            <Box w={'100%'} border={'1px dashed white'}/>
        </HStack>
    )
}

export { CustomDivider }