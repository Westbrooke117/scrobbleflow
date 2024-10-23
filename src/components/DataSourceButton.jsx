import {Button} from "@chakra-ui/react";
import PropTypes from "prop-types";

const DataSourceButton = ({hasLoaded, buttonText, activeDataSource, buttonDataSource, setDataSource}) => {
    if (hasLoaded){
        return (
            <Button
                w={'100%'}
                variant={'outline'}
                onClick={() => setDataSource(buttonDataSource)}>
                {buttonText}
            </Button>
        )
    }

    if (!hasLoaded && activeDataSource !== buttonDataSource){
        return (
            <Button
                disabled={true}
                w={'100%'}
                variant={'outline'}>
                {buttonText}
            </Button>
        )
    }

    else {
        return (
            <Button
                isLoading={true}
                loadingText={buttonText}
                w={'100%'}
                variant={'outline'}>
                {buttonText}
            </Button>
        )
    }
}

DataSourceButton.propTypes = {
    hasLoaded: PropTypes.bool.isRequired,
    buttonText: PropTypes.string.isRequired,
    activeDataSource: PropTypes.string.isRequired,
    buttonDataSource: PropTypes.string.isRequired,
    setDataSource: PropTypes.func.isRequired,
}

export {DataSourceButton}