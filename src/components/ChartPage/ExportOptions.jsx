import { useState } from "react";
import { Box, Text, HStack, Button } from "@chakra-ui/react";
import { Download, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { OptionsBoxHeading } from "./OptionsBoxHeading.jsx";

// Long enough that the spinner reads as feedback instead of a flicker on fast exports
const MIN_LOADING_MS = 300;

// Waits for the next paint, so the spinner is on screen before a synchronous export blocks the main thread
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const ExportOptions = ({ isDisabled, onExportCsv, onExportImage }) => {
    const [isExportingCsv, setIsExportingCsv] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);

    const runExport = async (setIsExporting, exportFn) => {
        setIsExporting(true);
        const minimumDelay = new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS));
        try {
            await nextPaint();
            await exportFn();
        } finally {
            await minimumDelay;
            setIsExporting(false);
        }
    };

    return (
        <Box mb={2}>
            <Box bg={'gray.900'} pl={5} pr={5} pt={2} pb={3} borderRadius={5}>
                <OptionsBoxHeading icon={Download}>Export Chart</OptionsBoxHeading>
                <hr />
                <HStack mt={2} justifyContent={'space-between'}>
                    <Button
                        onClick={() => runExport(setIsExportingCsv, onExportCsv)}
                        isDisabled={isDisabled}
                        isLoading={isExportingCsv}
                        leftIcon={<FileSpreadsheet size={16} />}
                        size={'sm'}
                        w={'100%'}
                    >CSV data</Button>
                    <Button
                        onClick={() => runExport(setIsExportingImage, onExportImage)}
                        isDisabled={isDisabled}
                        isLoading={isExportingImage}
                        leftIcon={<ImageIcon size={16} />}
                        size={'sm'}
                        w={'100%'}
                    >Chart image</Button>
                </HStack>
                <Text mt={2} fontSize={'sm'} color={'gray.400'}>
                    *CSV data exports the current state of the chart
                </Text>
            </Box>
        </Box>
    );
};
