import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import Map from "./routes/Map"
import Error from "./Error"

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ChakraProvider>
			<HashRouter>
				<Map />
			</HashRouter>
		</ChakraProvider>
	</React.StrictMode>
);