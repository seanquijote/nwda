import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import ReactDOM from 'react-dom/client'
import { createRoutesFromElements, createBrowserRouter, Route, RouterProvider } from 'react-router-dom'
import './index.css'

import Map from "./routes/Map"
import Error from "./Error"

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route
			path="/"
			element={<Map />}
			errorElement={<Error />}
		></Route>
	)
);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ChakraProvider>
			<RouterProvider router={router} />
		</ChakraProvider>
	</React.StrictMode>
);