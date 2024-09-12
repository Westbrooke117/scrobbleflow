import {Button} from "@chakra-ui/react";

const DataSourceButton = ({hasLoaded, buttonText, activeDataSource, dataSourceName, setDataSource}) => {

    if (hasLoaded) return <Button w={'100%'} variant={'outline'} onClick={() => setDataSource(dataSourceName)}>{buttonText}</Button>
    if (!hasLoaded && activeDataSource !== dataSourceName) return <Button disabled w={'100%'} variant={'outline'}>{buttonText}</Button>
    else return <Button isLoading loadingText={buttonText} w={'100%'} variant={'outline'}>{buttonText}</Button>
}

export {DataSourceButton}