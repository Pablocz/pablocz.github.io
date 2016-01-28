/**
 * Represents a restaurant showed in the google map
 * @constructor
 * @param {jsonObject} object return by the REST API Call from FourSquare
 * @param {marker} google maps marker
 */

'use strict';

var Restaurant = function (jsonObject, marker) {
    var self = this;
    //attributes of a restaurant
    self.id = jsonObject.id;
    self.name = jsonObject.name;
    self.lat = jsonObject.location.lat;
    self.lng = jsonObject.location.lng;
    self.address = jsonObject.location.address;
    self.marker = marker;

    self.contentString = '<p><b>' + self.name + '</b></p>'
        + '<p>' + self.address + '</p>';
};

/* Main View Model Application*/
function AppViewModel(map, status) {
    var self = this;

    // url for the Foursquare connection
    var foursquareUrl = "https://api.foursquare.com/v2/venues/search?client_id=SVXRU3Q5S31DCAPXBA1MPPTFOZYF2N4H0L1EDWWROPDDLQ2G&client_secret=40SOPZHMNKEHZ3MH4B1QLFPDHT5ZZ50JCSN2BGOI33SCN5K1&v=20130815&ll=40.420088,-3.688810&query=sushi"

    self.shouldShowMessage = ko.observable(false);
    self.restaurants = ko.observableArray([]);
    self.currentFilter = ko.observable("");
    self.shouldShowListView = ko.observable(true);
    self.buttonText = ko.observable("Hide");

    //function that loads the restaurants in the listview and the map
    self.fetchRestaurants = function (url) {
        $.getJSON(url,
            function (data) {
                $.each(data.response.venues, function (i, venues) {
                    var marker = new google.maps.Marker({
                        position: {lat: venues.location.lat, lng: venues.location.lng},
                        animation: google.maps.Animation.DROP,
                        map: map,
                        title: venues.name
                    });

                    var restaurant = new Restaurant(venues, marker);
                    self.restaurants.push(restaurant);

                    google.maps.event.addListener(restaurant.marker, 'click', function () {
                        self.selectRestaurant(restaurant);
                    });

                });
            }).fail(function () {
            self.shouldShowMessage(true);
        });
    };


    // function that filters the restaurants by name
    self.filterRestaurants = ko.computed(function () {
        if (!self.currentFilter()) {
            return self.restaurants();
        } else {
            return ko.utils.arrayFilter(self.restaurants(), function (restaurant) {
                return restaurant.name.toLowerCase().indexOf(self.currentFilter().toLowerCase()) !== -1;
            });
        }
    });

    // function that shows info about a restaurant when it is clicked in the map or in the listview
    self.selectRestaurant = function (restaurant) {

        //marker information
        infoWindow.setContent(restaurant.contentString);
        infoWindow.open(map, restaurant.marker);

        //movement in the map
        map.panTo(restaurant.marker.position);

        // marker effect
        restaurant.marker.setAnimation(google.maps.Animation.BOUNCE);

        // remove the animation in the 'not last clicked marker'
        // resturant is the one clicked, the others must be still
        self.restaurants().forEach(function (other_restaurant) {
            if (restaurant != other_restaurant) {
                other_restaurant.marker.setAnimation(null);
            }
        });
    };
    // function that shows or hides the listview when clicking the button
    self.toggleListView = function () {

        if(self.shouldShowListView()){
            self.shouldShowListView(false);
            self.buttonText("Show");
        }
       else{
            self.shouldShowListView(true);
            self.buttonText("Hide");
        }

    };

    if (status == "OK") {
        self.fetchRestaurants(foursquareUrl);
        var infoWindow = new google.maps.InfoWindow();
    }

    else {
        self.shouldShowMessage = ko.observable(true);
    }
};

/* Google Map Configuration*/
function initMap() {
    // this function will be called when the google maps api is loaded
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.420088, lng: -3.688810},
        zoom: 15,
        disableDefaultUI: true
    });
    var status = 'OK';
    ko.applyBindings(new AppViewModel(map, status));

}

function errorHandling() {
    // this function will be called when the google maps api is failed to load
    var status = 'ERROR';
    ko.applyBindings(new AppViewModel(map, status));
}
