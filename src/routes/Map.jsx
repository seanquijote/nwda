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
	Stack,
	HStack,
	Text,
	Image,
	Spinner,
	VisuallyHidden,
	Card,
	Heading,
	CardBody,
} from '@chakra-ui/react'
import { OriginContext } from "../contexts/OriginContext";
import Ratings from 'react-ratings-declarative';
import Layer from './Layer'
import Error from '../Error'

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

const restaurantTypes = ['Fast Casual', 'Fast Food', 'Casual Dining', 'Fine Dining', 'Bar', 'Family Style', 'Buffet', 'Diner'];

const restaurantSpecialties = ['Pizza', 'Lechon', 'Burger', 'Lomi', 'Sushi', 'Chicken', 'Bulalo', 'Pares', 'Pancit Canton', 'Congee']

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
		id: 'map-canvas',
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

				// const bounds = new window.google.maps.LatLngBounds(originCoords);

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
			destination: restaurant.places.geometry.location,
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

	const getRandomInt = (max) => {
		return Math.floor(Math.random() * max)
	}

	const onLoadRestaurants = useCallback(function callback(markerClusterer) {
		const mapCurrent = mapRef.current
		const bounds = mapCurrent.getBounds()
		const location = {
			lat: mapRef.current.data.map.center.lat(),
			lng: mapRef.current.data.map.center.lng(),
		}

		let restaurantResults = []
		let restaurantTotal = 0

		const service = new window.google.maps.places.PlacesService(mapCurrent)
		service.nearbySearch({
			// bounds: bounds,
			location: location,
			radius: 15000,
			keyword: 'cebu',
			type: ['restaurant']
		}, (results, status) => {
			if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
				for (let i = 0; i < results.length; i++) {
					const details = {
						type: restaurantTypes[getRandomInt(restaurantTypes.length)],
						specialty: restaurantSpecialties[getRandomInt(restaurantSpecialties.length)],
						analytics: {
							current_year: {
								patrons: getRandomInt(1000),
								revenue: getRandomInt(1000000),
							}
						}
					}
					restaurantTotal++
					restaurantResults = [...restaurantResults, { places: results[i], details: details }]
				}
				setRestaurants(restaurantResults)
				console.log('Restaurants: ', restaurantResults)
			}
		})
	}, [restaurants])

	useEffect(() => {
		setRestaurants(restaurants)
	}, [restaurants]);

	return (
		<>
			<OriginContext.Provider value={[origin, setOrigin]}>
				{isLoaded
					? (
						<Box className="container">
							<Box className="layer">
								<Layer setOrigin={(position) => {
									setOrigin(position)
									if (circle) circle.setCenter(position)
									if (map) {
										map.panTo(position)
									} else {
										mapRef.current.setZoom(15)
										mapRef.current.panTo(position)
									}
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
															key={restaurant.places.place_id}
															position={restaurant.places.geometry.location}
															clusterer={clusterer}
															onClick={() => {
																fetchDirections(restaurant);
																setSelected(restaurant);
															}}
														/>
													))
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

									{selected && (
										<InfoWindow
											position={selected.places.geometry.location}
											onCloseClick={() => {
												setSelected(null);
											}}
										>
											<Card direction={{ base: 'column', sm: 'row' }} p={2} ml={-4}>
												<Stack>
													<CardBody>
														<Heading size='md'>{selected.places.name}</Heading>
														{selected.places.rating
															? (
																<HStack my={1}>
																	<Text fontSize='md'>{selected.places.rating}</Text>
																	<Ratings
																		rating={selected.places.rating}
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
																	<Text fontSize='md'>{`(${selected.places.user_ratings_total})`}</Text>
																	{selected.places.opening_hours.isOpen()
																		? <Text fontSize='md' color='green'>Open</Text>
																		: <Text fontSize='md' color='red'>Closed</Text>
																	}
																</HStack>
															)
															: (
																<HStack my={1}>
																	<Text fontSize='md'>No reviews</Text>
																</HStack>
															)
														}
														<HStack mb={2}>
															{selected.places.plus_code &&
																selected.places.plus_code.compound_code
																? (
																	<Text fontSize='sm'>{selected.places.plus_code.compound_code} · </Text>
																)
																: (<></>)}
															<Text fontSize='sm'>{selected.places.vicinity}</Text>
														</HStack>
														<HStack mb={1}>
															<Text fontSize='sm'>Type: {selected.details.type}</Text>
														</HStack>
														<HStack mb={1}>
															<Text fontSize='sm'>Specialty: {selected.details.specialty}</Text>
														</HStack>
														<HStack mb={1}>
															<Text fontSize='sm'>Patrons: {new Intl.NumberFormat().format(selected.details.analytics.current_year.patrons)}</Text>
														</HStack>
														<HStack>
															<Text fontSize='sm'>Revenue: ₱ {new Intl.NumberFormat().format(selected.details.analytics.current_year.revenue)}</Text>
														</HStack>
													</CardBody>
												</Stack>
												{selected.places.photos !== undefined &&
													selected.places.photos.length > 0 &&
													<Box>
														<Image
															objectFit='cover'
															height='200px'
															width='200px'
															src={selected.places.photos[0].getUrl()}
															alt='Restaurant Images'
														/>
													</Box>
												}
											</Card>
										</InfoWindow>
									)}
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