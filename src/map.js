"use strict";

// AJAX Request to foursquare
function getInfo(search, callback) {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/explore?",
        data: {
            client_id: clientId,
            client_secret: clientSecret,
            v: '20130815',
            near: "Mountain View",
            query: search
        }
    }).done(callback).fail(function() {
        alert("sorry, there is a problem with loading data from foursquare");
    });
}


// VIEWMODEL
var ViewModel = function() {
    // some helper variables
    var self = this;
    var oldIndex;
    var emptyObject = {};
    var searched = "";

    // OBSERVABLES
    // observable searchedItem to monitor value in search box
    this.searchedItem = ko.observable();
    // observable array that will store information about venues from foursquare
    this.markerList = ko.observableArray([]);
    // observable (selected) currentItem
    this.currentItem = ko.observable();

    // FUNCTION DEFINITIONS

    // gets called when search button gets pressed or enter is hit
    this.update = function() {
        searched = self.searchedItem().toLowerCase();
        // set localStorage to empty current object, so outdated data won't persist when
        // making a new search
        self.emptyCurrentItem();
        // store stuff in localStorage
        self.setLocalStorageCurrent();
        self.setLocalStorageSearch();
        self.updateMarkers();
    };

    // set currentItem to empty object so nothing will be selected
    this.emptyCurrentItem = function() {
        self.currentItem(emptyObject);
        self.currentItem().title = "placeholder";
    };

    // store searched item in localStorage
    this.setLocalStorageSearch = function() {
        localStorage.setItem("searched", self.searchedItem());
    };

    /**
     * populates markerList according to searchedItem and
     * calls generateMarkers so map will be populated
     */
    this.updateMarkers = function(firstTime) {
        // remove markers form map
        if (!firstTime) {
            removeMarkers();
        }
        // empty marker list
        self.markerList([]);
        // call getInfo to get info from foursquare
        getInfo(searched, function(result) {
            var unsortedArray = [];
            var resultArray = result.response.groups[0].items;
            for (var i = 0; i < resultArray.length; i++) {
                // for each result make an object with needed info and append it to unsortedArray
                var x = {};
                x.title = resultArray[i].venue.name;
                var lat = resultArray[i].venue.location.lat;
                var lng = resultArray[i].venue.location.lng;
                x.markerPosition = {
                    lat: lat,
                    lng: lng
                };
                x.id = resultArray[i].venue.id;
                x.rating = resultArray[i].venue.rating;
                x.address = resultArray[i].venue.location.address;
                x.city = resultArray[i].venue.location.city;
                x.visibility = ko.observable(true);

                unsortedArray.push(x);
            }

            // sort Array according to rating
            var sortedArray = unsortedArray.sort(function(a, b) {
                if (a.rating === undefined) {
                    return 1;
                }
                if (b.rating === undefined) {
                    return -1;
                }
                if (a.rating > b.rating) {
                    return -1;
                }
                if (a.rating < b.rating) {
                    return 1;
                }
                return 0;
            });

            // give it the right index
            for (i = 0; i < sortedArray.length; i++) {
                sortedArray[i].index = i;
            }

            self.markerList(sortedArray);
            generateMarker();
            if (firstTime) {
                self.setCurrentItem();
            }
            animate(self.currentItem().index);
            oldIndex = self.currentItem().index;
        });
    };

    // store id of searched item in localStorage
    // (can't store entire object because marker cannot be stored)
    this.setLocalStorageCurrent = function() {
        localStorage.setItem("current", self.currentItem().id);
    };

    /**
     * give currentItem the value stored in localStorage,
     * otherwise make it an empty object, so nothing will be selected
     */
    this.setCurrentItem = function() {
        if (localStorage.getItem("current") != undefined) {
            var itemId = localStorage.getItem("current");
            for (var i = 0; i < self.markerList().length; i++) {
                if (self.markerList()[i].id === itemId) {
                    self.currentItem(self.markerList()[i]);
                }
            }

        } else {
            self.emptyCurrentItem();
        }
    };

    // select and animate marker
    this.setSelected = function(data) {
        self.currentItem(data);
        self.setLocalStorageCurrent();
        animate(oldIndex);
        oldIndex = data.index;
        animate(data.index);
    };


    // CODE FOR SECONDARY BEHAVIOUR

    // set list scroll to the right place, so selected list item is visible
    this.setScroll = function() {
        var element = document.getElementsByClassName("selected");
        var listDiv = document.getElementsByClassName("left");
        listDiv[0].scrollTop = element[0].offsetTop - (window.innerHeight / 2);
    };

    // code to toggle side nav visisbility
    // helper observable
    this.displayed = ko.observable(false);
    this.arrow = ko.observable("◀");
    // toogle side nav, resize and center map, change arrow direction in button
    this.setDisplay = function() {
        if (!self.displayed()) {
            self.displayed(true);
            setCenter();
            self.arrow("▶");
        } else {
            self.displayed(false);
            setCenter();
            self.arrow("◀");
        }
    };


    // GIVE INITAL VALUE TO searchedItem AND currentItem

    // give searchedItem the value stored in localStorage or the initial value sushi
    if (localStorage.getItem("searched") != undefined) {
        self.searchedItem(localStorage.getItem("searched"));
    } else {
        self.searchedItem("sushi");
    }

    // VERY UGLY FIX: give empty object id, so knockout won't complain in generate marker function
    // about missing id, need to wait for list to set currentItem, but view gets generated before that
    // could fix it by using other array - sorted array but would have to change scope of it
    if (localStorage.getItem("current") != undefined) {
        var itemId = localStorage.getItem("current");
        self.emptyCurrentItem();
        self.currentItem().id = itemId;
    } else {
        self.emptyCurrentItem();
    }

    // populate markerList for the first time
    searched = self.searchedItem().toLowerCase();
    this.updateMarkers(true);

};

var viewmodel = new ViewModel();
ko.applyBindings(viewmodel);



// MAP STUFF
// declare global variables so they can be called in viewmodel
var map;

var infowindow = {};

var removeMarkers = function() {
    // remove existing markers from map
    for (var i = 0; i < viewmodel.markerList().length; i++) {
        // check if marker is defined (won't be at first time running)
        if (viewmodel.markerList()[i].marker !== undefined) {
            viewmodel.markerList()[i].marker.setMap(null);
            // empty marker array
            delete viewmodel.markerList()[i].marker;
        }
    }
};
// define some functions
// generate markers using viewmodel.markerList
var generateMarker = function() {

    // define normal marker icon
    var image1 = {
        url: 'images/marker-dark.svg',
        scaledSize: new google.maps.Size(30, 40)
    };
    // define icon for higher rated venues
    var image2 = {
        url: 'images/marker-lighter.svg',
        scaledSize: new google.maps.Size(30, 40)
    };
    // calculate rating average
    var rating = 0;
    var numRatings = 0;
    for (var i = 0; i < viewmodel.markerList().length; i++) {
        if (viewmodel.markerList()[i].rating !== undefined) {
            rating = rating + viewmodel.markerList()[i].rating;
            numRatings = numRatings + 1;
        }
    }
    var ratingAverage = rating / numRatings;

    // generate marker according to viewmodel.makerList
    for (i = 0; i < viewmodel.markerList().length; i++) {
        var marker = new google.maps.Marker({
            position: viewmodel.markerList()[i].markerPosition,
            map: map,
            title: viewmodel.markerList()[i].title,
            animation: google.maps.Animation.DROP
        });
        // choose marker image according to rating
        if (viewmodel.markerList()[i].rating < ratingAverage || viewmodel.markerList()[i].rating === undefined) {
            marker.setIcon(image1);
        } else {
            marker.setIcon(image2);
            marker.setZIndex(1000);
        }
        // add marker to array

        viewmodel.markerList()[i].marker = marker;
        // and add event listener so animation starts and infowindow opens by calling setSelected on click
        viewmodel.markerList()[i].marker.addListener('click', (function(markerCopy) {
            return function() {
                viewmodel.setSelected(viewmodel.markerList()[markerCopy]);
                // scroll to the right spot in the list when marker is clicked
                viewmodel.setScroll();
            };
        })(i));
    }
};

// animates marker and opens infowindow when called by setSelected
var animate = function(markerNumber) {
    /**
     * check if markerNumber and (old) marker exists,
     * otherwise there will be an error when user searches for venue with little results
     */
    if (markerNumber !== undefined && viewmodel.markerList()[markerNumber].marker !== undefined) {
        // if markerNumber is index of currentItem, marker will be animated
        if (markerNumber === viewmodel.currentItem().index) {
            viewmodel.markerList()[markerNumber].marker.setAnimation(google.maps.Animation.BOUNCE);
            // define content of infowindow
            var contentString = "<div><h3>" + viewmodel.currentItem().title + "</h3>";
            // check if address, city and rating have a value
            if (viewmodel.currentItem().address !== undefined &&
                viewmodel.currentItem().city !== undefined) {
                contentString = contentString + "<address>" +
                    viewmodel.currentItem().address + " <br>" +
                    viewmodel.currentItem().city + " </address>";
            }
            if (viewmodel.currentItem().rating !== undefined) {
                contentString = contentString +
                    "<p class=\"rating\"><span class=\"ratingSpan\">★ </span>" +
                    viewmodel.currentItem().rating + "</p>";
            }
            contentString = contentString +
                "<a href=\"https://foursquare.com/v/" +
                viewmodel.currentItem().id +
                "\" target=\"_blank\">read more</a></div>";
            // set content of infowindow and open
            infowindow.setContent(contentString);
            infowindow.open(map, viewmodel.markerList()[markerNumber].marker);
        } else {
            // markerNumber is not index of currentItem, so deactivate animation
            viewmodel.markerList()[markerNumber].marker.setAnimation(null);
        }
    }
};

// sets center and resizes map
var setCenter = function() {
    var currentCenter = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(currentCenter);
};

// gets called when there is an error in request to Google maps
function googleError() {
    alert('Sorry, Google maps could not be loaded.');
}

// gets called on success
function initMap() {
    var centerMap = {
        lat: 37.383428,
        lng: -122.066492
    };
    // initialize map
    map = new google.maps.Map(document.getElementById('map'), {
        center: centerMap,
        zoom: 12,
        // map control
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });

    // initialize info window
    infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });

    // call function for the first time so map is populated with markers on initial view
    // generateMarker();

    animate(viewmodel.currentItem().index);
    viewmodel.oldIndex = viewmodel.currentItem().index;

}

/**
 * map aligend to center when window resizes, code from:
 * http://stackoverflow.com/questions/13034188/how-to-center-align-google-maps-in-a-div-with-a-variable-width
 */
$(window).on('resize', function() {
    var currCenter = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currCenter);
});