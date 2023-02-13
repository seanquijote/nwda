import { useState, useRef, useCallback, useEffect } from "react";
import {
	GoogleMap,
	useJsApiLoader,
	InfoWindow,
	Marker,
	Circle,
	MarkerClusterer,
	DirectionsRenderer,
} from '@react-google-maps/api';
import {
	Box,
	Container,
	VStack,
	HStack,
	Text,
	Image,
	Spinner,
	VisuallyHidden,
} from '@chakra-ui/react'
import { OriginContext } from "../contexts/OriginContext";
import Layer from './Layer'
import Error from '../Error'
import Ratings from 'react-ratings-declarative';

const libraries = ['places']

const cebuCoords = {
	lat: 10.333332,
	lng: 123.749997
};

const options = {
	disableDefaultUI: false,
	clickableIcons: false,
}

const originMarkerIcon = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'

const defaultOptions = {
	strokeOpacity: 0.5,
	strokeWeight: 2,
	clickable: false,
	draggable: false,
	editable: false,
	visible: true,
};

const closeOptions = {
	...defaultOptions,
	zIndex: 3,
	fillOpacity: 0.1,
	strokeColor: "#25da60",
	fillColor: "#48b787",
};

export default function Map() {
	const [map, setMap] = useState(null)
	const [origin, setOrigin] = useState(null);
	const [destination, setDestination] = useState(null);
	const [directions, setDirections] = useState(null);
	const [restaurants, setRestaurants] = useState(null);
	const [selected, setSelected] = useState(null);
	const [circle, setCircle] = useState(null);
	const mapRef = useRef()
	const { isLoaded, loadError } = useJsApiLoader({
		id: 'map',
		googleMapsApiKey: import.meta.env.VITE_MAPS_API_KEY,
		libraries: libraries
	})

	const onClickMap = useCallback(function callback(map) {
		if (origin) return

		setOrigin({
			lat: map.latLng.lat(),
			lng: map.latLng.lng(),
		});
	}, []);

	const onLoadMap = useCallback(function callback(map) {
		mapRef.current = map

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(position => {
				const originCoords = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
				setOrigin(originCoords)

				const bounds = new window.google.maps.LatLngBounds(originCoords);
				map.setZoom(15)
				map.panTo(originCoords)
				mapRef.current = map
				setMap(map)
			}, err => {
				console.warn(err)
			})
		} else {
			alert('Geolocation is not supported.')
		}
	}, [])

	const onUnmountMap = useCallback(function callback(map) {
		setMap(null)
		setOrigin(null)
	}, [])

	const fetchDirections = (restaurant) => {
		if (!origin) return

		const service = new window.google.maps.DirectionsService();
		service.route({
			origin: origin,
			destination: restaurant.geometry.location,
			travelMode: window.google.maps.TravelMode.DRIVING,
		}, (result, status) => {
			if (status === "OK" && result) {
				setDirections(result);
			}
		})
	}

	const onLoadCircle = useCallback(function callback(data) {
		setCircle(data)
	}, [])

	const onUnmountCircle = useCallback(function callback(data) {
		setCircle(null)
	}, [])

	const removeCircle = () => {
		if (!circle) return
		window.google.maps.event.clearListeners(circle, 'click_handler_name');
		window.google.maps.event.clearListeners(circle, 'drag_handler_name');
		circle.setRadius(0);
		circle.setMap(null);
	}

	const onLoadRestaurants = useCallback(function callback(markerClusterer) {
		let mapCurrent = mapRef.current
		const bounds = mapCurrent.getBounds()

		console.log('INDEX NOT NULL map: ', mapCurrent)

		const service = new window.google.maps.places.PlacesService(mapCurrent).nearbySearch({
			bounds: bounds,
			// location: bounds,
			// radius: bounds,
			keyword: 'cebu',
			type: ['restaurant']
		}, (results, status) => {
			console.log('Test onLoadRestaurants result status: ', { results, status })
			if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
				setRestaurants(results)
				console.log('Test onLoadRestaurants restaurantState: ', restaurants)
			}
		})
	}, [restaurants])

	useEffect(() => {
		setRestaurants(restaurants)
		console.log("INDEX useEffect restaurants", restaurants);
	}, [restaurants]);

	return (
		<>
			<OriginContext.Provider value={[origin, setOrigin]}>
				{isLoaded
					? (
						<Box className="container">
							<Box className="layer">
								<Layer setOrigin={(position) => {
									removeCircle()
									setOrigin(position)
									map.panTo(position)
								}} />
							</Box>
							<Box className="map">
								<GoogleMap
									mapContainerClassName='map-container'
									center={cebuCoords}
									options={options}
									zoom={10}
									onLoad={onLoadMap}
									// onClick={onClickMap}
									onUnmount={onUnmountMap}
								>
									{directions && (
										<DirectionsRenderer
											directions={directions}
											options={{
												suppressMarkers: true,
												polylineOptions: {
													strokeWeight: 5,
													zIndex: 50,
													strokeColor: "#0053ff",
												},
											}}
										/>
									)}

									{origin && (
										<>
											<Marker
												position={origin}
												title='Origin'
												icon={originMarkerIcon}
											/>

											<MarkerClusterer
												onLoad={onLoadRestaurants}
											>
												{(clusterer) =>
													restaurants &&
													restaurants.map((restaurant) => (
														<Marker
															key={restaurant.place_id}
															position={restaurant.geometry.location}
															clusterer={clusterer}
															onClick={() => {
																fetchDirections(restaurant);
																setSelected(restaurant);

																if (directions) {
																	directions.setMap(null)
																	setDestination(null)
																}
															}}
														/>
													)
													)
												}
											</MarkerClusterer>

											<Circle
												onLoad={onLoadCircle}
												center={origin}
												radius={15000}
												options={closeOptions}
												onUnmount={onUnmountCircle}
											/>
										</>
									)}

									{selected ? (
										<InfoWindow
											position={selected.geometry.location}
											onCloseClick={() => {
												if (directions) {
													directions.setMap(null)
													setDestination(null)
												}
												setSelected(null);
											}}
										>
											<VStack p={4} spacing={1} align='left' wordBreak='break-word'>
												<HStack>
													<Image height='200px' width='200px' mb={2} src={selected.photos[0].getUrl()} alt='Restaurant Images' />
												</HStack>
												<HStack>
													<Text fontSize='xl' as='b'>{selected.name}</Text>
												</HStack>
												{selected.rating
													? (
														<HStack>
															<Text fontSize='md'>{selected.rating}</Text>
															<Ratings
																rating={selected.rating}
																widgetRatedColors='orange'
																widgetDimensions='15px'
																widgetSpacings='2px'
															>
																<Ratings.Widget />
																<Ratings.Widget />
																<Ratings.Widget />
																<Ratings.Widget />
																<Ratings.Widget />
															</Ratings>
															<Text fontSize='md'>{`(${selected.user_ratings_total})`}</Text>
														</HStack>
													)
													: (
														<HStack>
															<Text fontSize='md'>No reviews</Text>
														</HStack>
													)
												}
												<HStack>
													{selected.plus_code &&
														selected.plus_code.compound_code
														? (
															<Text fontSize='sm'>{selected.plus_code.compound_code} · </Text>
														)
														: (<></>)}
													<Text fontSize='sm'>{selected.vicinity}</Text>
											</HStack>
										</VStack>
										</InfoWindow>
									) : null}
							</GoogleMap>
						</Box>
						</Box>
			)
			: (
			<Container centerContent>
				<Spinner thickness='4px' color='blue.500' emptyColor='gray.200' size='lg' my={500}>
					<VisuallyHidden>Loading...</VisuallyHidden>
				</Spinner>
			</Container>
			)
				}
			{loadError && <Error />}
		</OriginContext.Provider>
		</>
	);
}