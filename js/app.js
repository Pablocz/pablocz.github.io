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
    var foursquareUrl = "https://api.foursquare.com/v2/venues/search?client_id=SVXRU3Q5S31DCAPXBA1MPPTFOZYF2N4H0L1EDWWROPDDLQ2G&client_secret=40SOPZHMNKEHZ3MH4B1QLFPDHT5ZZ50JCSN2BGOI33SCN5K1&v=20130815&ll=40.420088,-3.688810&query=sushi";

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

                    // I WILL TRY GOOGLE BOUNDS IN THE NEXT PROJECTS

                    var restaurant = new Restaurant(venues, marker);
                    self.restaurants.push(restaurant);

                    google.maps.event.addListener(restaurant.marker, 'click', function () {
                        self.selectRestaurant(restaurant);
                        // Posible option of hiding listview when click marker
                      //  self.shouldShowListView(false);
                      //  self.buttonText("Show");
                    });

                });
            }).fail(function () {
            self.shouldShowMessage(true);
        });
    };


    // function that filters the restaurants by name
    self.filterRestaurants = ko.computed(function () {
        // markers are set to not visible while filtering
        self.restaurants().forEach(function (restaurant) {
            restaurant.marker.setVisible(false);
            infoWindow.close();
        });

        if (!self.currentFilter()) {
            // if there is no filtering word markers are set to visible
            self.restaurants().forEach(function (restaurant) {
                restaurant.marker.setVisible(true);
            });
            return self.restaurants();
        } else {
            var filteredRestaurants = ko.utils.arrayFilter(self.restaurants(), function (restaurant) {
                return restaurant.name.toLowerCase().indexOf(self.currentFilter().toLowerCase()) !== -1;
            });
        }

        // finally just filtered restaurants are showed
        filteredRestaurants.forEach(function (restaurant) {
            restaurant.marker.setVisible(true);
        });

        return filteredRestaurants;
    });

    // function that shows info about a restaurant when it is clicked in the map or in the listview
    self.selectRestaurant = function (restaurant) {

        //marker information
        infoWindow.setContent(restaurant.contentString);
        infoWindow.open(map, restaurant.marker);

        //movement in the map
        map.panTo(restaurant.marker.position);
        //Showing marker in a lower position to avoid that listview hides infowindow
        map.panBy(0, -150);

        // marker effect
        restaurant.marker.setAnimation(google.maps.Animation.BOUNCE);

        // bounce finishes after 2.1 seconds
        window.setTimeout(function () {
            restaurant.marker.setAnimation(null);
        }, 2100);

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

        if (self.shouldShowListView()) {
            self.shouldShowListView(false);
            self.buttonText("Show");
        }
        else {
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
}

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
