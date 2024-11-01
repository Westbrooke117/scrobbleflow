import {createRoot} from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {ChakraProvider} from "@chakra-ui/react";
import {BrowserRouter} from "react-router-dom";
import theme from './theme.js'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ChakraProvider theme={theme}>
            <App/>
        </ChakraProvider>
    </BrowserRouter>
)
