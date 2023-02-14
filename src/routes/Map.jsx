import { useId, useState, useRef, useCallback, useEffect } from "react";
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
    useToast,
} from '@chakra-ui/react'
import { MapContext } from "../contexts/MapContext"
import { OriginContext } from "../contexts/OriginContext"
import { RestaurantContext } from "../contexts/RestaurantContext"
import Ratings from 'react-ratings-declarative'
import Layer from './Layer'
import Error from '../Error'
import Constants from '../utilities/Constants'
import Utils from '../utilities/Utils'

const libraries = Constants.LIBRARIES
const cebuCoordinates = Constants.CEBU_COORDINATES
const options = Constants.MAP_OPTIONS
const mapRadius = Constants.MAP_RADIUS
const originMarkerIcon = Constants.ORIGIN_MARKER_ICON
const closeOptions = Constants.CIRCLE_OPTIONS
const placesTypesRestaurants = Constants.PLACES_TYPES_RESTAURANTS
const restaurantTypes = Constants.RESTAURANT_TYPES
const restaurantSpecialties = Constants.RESTAURANT_SPECIALTIES

export default function Map() {
    const toast = useToast()
    const toastFilterId = useId()
	const [map, setMap] = useState(null)
	const [origin, setOrigin] = useState(null);
	const [destination, setDestination] = useState(null);
	const [directions, setDirections] = useState(null);
	const [restaurants, setRestaurants] = useState(null);
	const [selected, setSelected] = useState(null);
	const [circle, setCircle] = useState(null);
	const [markersRestaurants, setMarkersRestaurants] = useState([]);
	const [markerCluster, setMarkerCluster] = useState(null);

	const mapRef = useRef()
	const directionsRef = useRef()
	const markerClusterRef = useRef()

	let markersRestaurantsArr = []

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
				const originCoordinates = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
				setOrigin(originCoordinates)
				map.setZoom(15)
				map.panTo(originCoordinates)
				mapRef.current = map
				setMap(map)
			}, err => {
				console.warn(err)
				setMap(map)
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

	const onLoadDirections = useCallback(function callback(directionsRenderer) {
		directionsRef.current = directionsRenderer
	}, [])

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

	const onLoadMarkerRestaurants = useCallback(function callback(marker) {
		markersRestaurantsArr = [...markersRestaurantsArr, marker]
		setMarkersRestaurants(markersRestaurantsArr)
	}, [markersRestaurants])

	useEffect(() => {
		setMarkersRestaurants(markersRestaurants)
	}, [markersRestaurants]);

	const onLoadRestaurants = useCallback(function callback(markerClusterer) {
		markerClusterRef.current = markerClusterer
		setMarkerCluster(markerCluster)

		const mapCurrent = mapRef.current
		const location = {
			lat: mapRef.current.data.map.center.lat(),
			lng: mapRef.current.data.map.center.lng(),
		}

		let restaurantResults = []
		let restaurantTotal = 0

		const service = new window.google.maps.places.PlacesService(mapCurrent)
		service.nearbySearch({
			location: location,
			radius: mapRadius,
			keyword: 'cebu',
			type: placesTypesRestaurants
		}, (results, status) => {
			if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
				for (let i = 0; i < results.length; i++) {
					const details = {
						type: restaurantTypes[Utils.getRandomInt(restaurantTypes.length)],
						specialty: restaurantSpecialties[Utils.getRandomInt(restaurantSpecialties.length)],
						analytics: {
							current_year: {
								customer_visits: Utils.getRandomInt(1000),
								revenue: Utils.getRandomInt(1000000),
							}
						}
					}
					restaurantTotal++
					restaurantResults = [...restaurantResults, { places: results[i], details: details }]
				}
				setRestaurants(restaurantResults)
			}
		})
	}, [restaurants])

	useEffect(() => {
		setRestaurants(restaurants)
	}, [restaurants]);

	return (
		<>
			<MapContext.Provider value={[map, setMap]}>
				<OriginContext.Provider value={[origin, setOrigin]}>
					<RestaurantContext.Provider value={[restaurants, setRestaurants]}>
						{isLoaded
							? (
								<Box className="container">
									<Box className="layer">
										<Layer
											setOrigin={(position) => {
												setOrigin(position)
												if (circle) circle.setCenter(position)
												if (map) {
													map.panTo(position)
												} else {
													mapRef.current.setZoom(15)
													mapRef.current.panTo(position)
												}
											}}

											setRestaurants={(filteredRestaurants) => {
												setSelected(null)

												if (directions) {
													setDirections(null)
												}

												if (markersRestaurants.length > 0) {

													for (let i = 0; i < markersRestaurants.length; i++) {
														markersRestaurants[i].setMap(null)
													}
													setMarkersRestaurants([])
												}

												let markersFiltered = []

												markerClusterRef.current.clearMarkers()
												for (let i = 0; i < filteredRestaurants.length; i++) {
													let marker = new window.google.maps.Marker({
														key: filteredRestaurants[i].places.place_id,
														position: filteredRestaurants[i].places.geometry.location,
														title: filteredRestaurants[i].places.name,
													})
													window.google.maps.event.addListener(marker, 'click', () => {
														fetchDirections(filteredRestaurants[i])
														setSelected(filteredRestaurants[i])
													});
													markersFiltered = [...markersFiltered, marker]
												}
												mapRef.current.setZoom(13)
												mapRef.current.panTo(origin)
												markerClusterRef.current.addMarkers(markersFiltered)

												if (!toast.isActive(toastFilterId)) {
													toast({
														id: toastFilterId,
														description: `We found ${filteredRestaurants.length} restaurants.`,
														status: 'success',
														position: 'top',
														isClosable: true,
													})
												}
											}}
										/>
									</Box>
									<Box className="map">
										<GoogleMap
											mapContainerClassName='map-container'
											center={cebuCoordinates}
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
																	title={restaurant.places.name}
																	clusterer={clusterer}
																	onLoad={onLoadMarkerRestaurants}
																	onClick={() => {
																		fetchDirections(restaurant)
																		setSelected(restaurant)
																	}}
																/>
															))
														}
													</MarkerClusterer>

													<Circle
														onLoad={onLoadCircle}
														center={origin}
														radius={mapRadius}
														options={closeOptions}
														onUnmount={onUnmountCircle}
													/>

													{destination && (
														<Marker
															position={destination}
															title='Searched/filtered destination'
														/>
													)}
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
																	<Text fontSize='sm'>Customer Visits: {new Intl.NumberFormat().format(selected.details.analytics.current_year.customer_visits)}</Text>
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
					</RestaurantContext.Provider>
				</OriginContext.Provider>
			</MapContext.Provider>
		</>
	);
}