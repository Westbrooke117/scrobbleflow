import { Flex, Icon, Text } from "@chakra-ui/react";

// Title row shared by the sidebar option boxes: an icon followed by the box name
export const OptionsBoxHeading = ({ icon, children }) => (
    <Flex alignItems={'center'} gap={2} mb={1}>
        <Icon as={icon} boxSize={5} color={'gray.400'} />
        <Text fontSize={20}>{children}</Text>
    </Flex>
);
