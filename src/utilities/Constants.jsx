const Constants = {
    LIBRARIES: ['places'],
    CEBU_COORDINATES: {
        lat: 10.333332,
        lng: 123.749997
    },
    MAP_OPTIONS: {
        disableDefaultUI: false,
        clickableIcons: false,
    },
    MAP_RADIUS: 15000,
    ORIGIN_MARKER_ICON: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
    CIRCLE_OPTIONS: {
        strokeOpacity: 0.5,
        strokeWeight: 2,
        clickable: false,
        draggable: false,
        editable: false,
        visible: true,
        zIndex: 3,
        fillOpacity: 0.1,
        strokeColor: "#25da60",
        fillColor: "#48b787",
    },
    RESTAURANT_TYPES: [
        'Fast Casual',
        'Fast Food',
        'Casual Dining',
        'Fine Dining',
        'Bar',
        'Family Style',
        'Buffet', 'Diner'
    ],
    RESTAURANT_SPECIALTIES: [
        'Pizza',
        'Lechon',
        'Burger',
        'Lomi',
        'Korean',
        'Chicken',
        'Milk Tea',
        'BBQ',
        'Pancit Canton',
        'Congee'
    ],
    PLACES_TYPES_DEFAULT: [],
    PLACES_TYPES_RESTAURANTS: ['restaurant'],
    COUNTRY_REGION_CODE: 'ph',
    FILTER_RATINGS: [1.0, 2.0, 3, 4.0, 5.0]

}

export default Constants