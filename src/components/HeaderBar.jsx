import {Avatar, Box, HStack, Text} from "@chakra-ui/react";

const HeaderBar = () => {
    return (
        <HStack bg={'#171923'}>
            <Box spacing={0} justifyContent={'space-between'} ml={4} mb={2}>
                <Text fontSize={32} fontWeight={'bold'}>ScrobbleFlow</Text>
                <Text fontSize={16} mt={-2}>powered by <a rel={'noreferrer'} target={'_blank'} href={'https://www.last.fm/about'}>last.fm</a></Text>
            </Box>
            <Avatar
                ml={'auto'}
                mr={3}
                src={'https://img.icons8.com/m_sharp/200/FFFFFF/github.png'}
                onClick={() => {window.open('https://github.com/Westbrooke117/scrobbleflow')}}
                style={{cursor: 'pointer'}}
                title={'View on GitHub'}
            />
        </HStack>
    )
}

export {HeaderBar}