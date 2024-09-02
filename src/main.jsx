import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {ChakraProvider} from "@chakra-ui/react";
import {BrowserRouter} from "react-router-dom";

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ChakraProvider>
            <App />
        </ChakraProvider>
    </BrowserRouter>
)
