import { useContext, useState } from "react";
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
    VStack,
    StackDivider,
    useDisclosure
} from '@chakra-ui/react'
import { Icon } from '@chakra-ui/react'
import { MdRestaurant } from 'react-icons/md'
import { OriginContext } from "../contexts/OriginContext";
import useOnclickOutside from "react-cool-onclickoutside";

const restaurantTypes = ['restaurant']
const countryRegionCode = 'ph'

export default function Layer({ setOrigin }) {
    const [ origin ] = useContext(OriginContext)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [ popoverOpen, setPopoverOpen ] = useState(false)
    let originOptions = {}
    let restaurantOptions = {}

    if (origin != null) {
        const bounds = new window.google.maps.LatLngBounds(origin);
        restaurantOptions = {
            location: origin,
            bounds: bounds,
            radius: 20000,
            types: restaurantTypes,
            componentRestrictions: { country: countryRegionCode },
            region: countryRegionCode,
        }
    } else {
        restaurantOptions = {
            types: restaurantTypes,
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

    const renderAddress = () => {
        clearSuggestions()

        getGeocode({ location: origin, region: countryRegionCode }).then((results) => {
            console.log("renderAddress Result: ", results[0])
        })

        // return (
        //     <>

        //     </>
        // )
    }

    return (
        <>
            <Grid>
                <Text fontSize='3xl' as='b'>Hungry?</Text>
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
                            placeholder='Search for a restaurant'
                            variant='filled'
                            my={5}
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
            </Grid>
        </>
    );
}