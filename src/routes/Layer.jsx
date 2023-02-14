import { useId, useContext, useState } from "react";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import {
    Grid,
    Box,
    Text,
    Input,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Select,
    VStack,
    StackDivider,
    FormControl,
    FormLabel,
    Icon,
    Button,
    useToast,
    useDisclosure,
} from '@chakra-ui/react'
import { MdRestaurant, MdFilterList } from 'react-icons/md'
import { ImCompass2 } from 'react-icons/im'
import { MapContext } from "../contexts/MapContext"
import { OriginContext } from "../contexts/OriginContext"
import { RestaurantContext } from "../contexts/RestaurantContext"
import useOnclickOutside from "react-cool-onclickoutside"
import Constants from '../utilities/Constants'
import Utils from '../utilities/Utils'

const mapRadius = Constants.MAP_RADIUS
const placesTypesRestaurant = Constants.PLACES_TYPES_RESTAURANTS
const countryRegionCode = Constants.COUNTRY_REGION_CODE
const ratings = Constants.FILTER_RATINGS
const restaurantTypes = Constants.RESTAURANT_TYPES
const restaurantSpecialties = Constants.RESTAURANT_SPECIALTIES

export default function Layer({ setOrigin, setRestaurants }) {
    const toast = useToast()
    const toastFilterId = useId()
    const [ map ] = useContext(MapContext)
    const [ origin ] = useContext(OriginContext)
    const [ restaurants ] = useContext(RestaurantContext)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [ popoverOpen, setPopoverOpen ] = useState(false)
    const [ filterRating, setFilterRating ] = useState('')
    const [ filterType, setFilterType ] = useState('')
    
    let restaurantOptions = {}

    if (origin != null) {
        const bounds = new window.google.maps.LatLngBounds(origin);
        restaurantOptions = {
            location: origin,
            bounds: bounds,
            radius: 20000,
            componentRestrictions: { country: countryRegionCode },
            region: countryRegionCode,
        }
    } else {
        restaurantOptions = {
            componentRestrictions: { country: countryRegionCode },
            region: countryRegionCode,
        }
    }

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: restaurantOptions,
        debounce: 300,
    });

    const ref = useOnclickOutside(() => {
        clearSuggestions();
    });

    const handleInput = (e) => {
        const val = e.target.value
        setValue(val)
        if (val.trim().length > 0) {
            setPopoverOpen(true)
        } else {
            setPopoverOpen(false)
        }
    };

    const handleSelect = ({ description }) => () => {
        setValue(description, false)
        clearSuggestions()

        getGeocode({ address: description }).then((results) => {
            const { lat, lng } = getLatLng(results[0])
            setOrigin({ lat: lat, lng: lng })
        })
    }

    const getLocation = () => {
        navigator.permissions.query({ name: 'geolocation' }).then(console.log)

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setOrigin({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
                navigator.permissions.query({ name: 'geolocation' }).then(console.log)
            }, err => {
                navigator.permissions.query({ name: 'geolocation' }).then(console.log)
                console.warn(err)
            })
        } else {
            alert('Geolocation is not supported.')
        }
    }

    const filterRestaurants = () => {
        const filterWarning = {
            id: toastFilterId,
            title: 'Warning!',
            description: 'Please set your current location first.',
            status: 'warning',
            position: 'top',
            isClosable: true,
        }

        /* Check if contexts values are present */
        if (!map || !origin || !restaurants) {
            if (!toast.isActive(toastFilterId)) {
                toast(filterWarning)
            }
            return
        }

		let filteredRestaurantResults = []
		let restaurantTotal = 0

		const service = new window.google.maps.places.PlacesService(map)
		service.nearbySearch({
			location: origin,
			radius: mapRadius,
			keyword: 'cebu',
			type: placesTypesRestaurant
		}, (results, status) => {
			if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
				for (let i = 0; i < results.length; i++) {
                    let filteredResult = null
                    let filteredRatingInt = parseInt(filterRating)

                    /* Input validation */
                    if (filterRating !== '' || filteredRatingInt > 0) {
                        
                        /* Check if result rating is not undefined or empty */
                        if (results[i].rating) {
                            let resultsRating = results[i].rating
                            let minRating = filteredRatingInt
                            let maxRating = filteredRatingInt + 1
    
                            /* Check if min rating is 5 stars or greater */
                            if (minRating >= 5) {

                                /* Check if result rating is greater or equal to the min rating */
                                if (resultsRating >= minRating) {
                                    console.log('LAYER filterRating 5 star test: ',{
                                        min_rating: minRating,
                                        filter_rating: resultsRating,
                                    })
                                    filteredResult = results[i]
                                }
                            }
                            
                            /* Check if min rating is 1-3 stars */
                            if (minRating <= 4) {

                                /* Check if result rating is within the range of the min and max rating */
                                if (resultsRating >= minRating && resultsRating < maxRating) {
                                    console.log('LAYER filterRating 1-4 star test: ',{
                                        min_rating: minRating,
                                        filter_rating: resultsRating,
                                        max_rating: maxRating,
                                    })
                                    filteredResult = results[i]
                                }
                            }
                        } else {
                            break // Skip to the next iteration if result rating is undefined
                        }
                    } else {
                        filteredResult = results[i] // No rating filter applied
                    }

                    /* Skip to the next iteration if filtered result is null */
                    if (filteredResult == null) break

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

                    /* Input validation */
                    if (filterType !== '') {
                        details.type = filterType // Only change the type
                    }

					restaurantTotal++

					filteredRestaurantResults = [...filteredRestaurantResults, { places: filteredResult, details: details }]
				}
				console.log('LAYER Filtered Restaurants: ', filteredRestaurantResults)
				setRestaurants(filteredRestaurantResults)
			}
		})
    }

    return (
        <>
            <Grid>
                <Text fontSize='3xl' as='b'>NWDA</Text>
                <Text fontSize='md' as='i' mb={2}>Click on the <strong style={{ color: 'red' }}>red</strong> markers to display the restaurant data and directions from the current location</Text>
                <FormControl>
                    <Text className="line-through" fontSize='md' mt={8}><span>Current Location</span></Text>
                    <Button
                        colorScheme='blue'
                        width='100%'
                        leftIcon={<ImCompass2 />}
                        mt={1}
                        onClick={getLocation}
                    >
                        Detect your current location
                    </Button>
                    <Text className="line-through" mt={5}><span>or</span></Text>
                    <Popover
                        autoFocus={false}
                        returnFocusOnClose={true}
                        isOpen={popoverOpen}
                        onClose={onClose}
                        placement='bottom'
                        closeOnBlur={false}
                        offset={[0, 2]}
                    >
                        <PopoverTrigger>
                            <Input
                                value={value}
                                onChange={handleInput}
                                isDisabled={!ready}
                                placeholder='Search for your current location'
                                variant='filled'
                                mt={2}
                            />
                        </PopoverTrigger>
                        {status === "OK" &&
                            <PopoverContent>
                                <PopoverBody>
                                    <VStack
                                        divider={<StackDivider borderColor='gray.200' />}
                                        spacing={3}
                                        align='stretch'
                                    >
                                        {
                                            data.map((suggestion) => (
                                                <Box key={suggestion.place_id} onClick={handleSelect(suggestion)}>
                                                    <Icon as={MdRestaurant} color='orange.400' mr={1} boxSize={3.5} />
                                                    <strong>{suggestion.structured_formatting.main_text}</strong> <small>{suggestion.structured_formatting.secondary_text}</small>
                                                </Box>
                                            ))
                                        }
                                    </VStack>
                                </PopoverBody>
                            </PopoverContent>
                        }
                    </Popover>
                    <Text className="line-through" fontSize='md' mt={10}><span>Filters</span></Text>
                    <FormLabel mt={5}>Rating at least</FormLabel>
                    <Select placeholder='Any rating' variant='filled' value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                        {ratings.map((value, key) =>
                            <option key={key} value={value}>{value} stars</option>
                        )}
                    </Select>
                    <FormLabel mt={5}>Restaurant type</FormLabel>
                    <Select placeholder='Any type' variant='filled' value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        {restaurantTypes.map((value, key) =>
                            <option key={key} value={value}>{value}</option>
                        )}
                    </Select>
                    <Button
                        colorScheme='green'
                        width='100%'
                        leftIcon={<MdFilterList />}
                        my={6}
                        onClick={filterRestaurants}
                    >
                        Filter Restaurants
                    </Button>
                </FormControl>
            </Grid>
        </>
    );
}