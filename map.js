// api key : AIzaSyBdiv9bYXkO-fwLjjWYawwXuOs0E78c29k
// model? data
var markersData = [{
    index: 0,
    title: "Castro street",
    markerPosition: {
        lat: 37.388343,
        lng: -122.082375
    }
}, {
    index: 1,
    title: "Shoreline Park",
    markerPosition: {
        lat: 37.431701,
        lng: -122.087610
    }
}, {
    index: 2,
    title: "Farmer\'s Market",
    markerPosition: {
        lat: 37.393355,
        lng: -122.073995
    }
}, {
    index: 3,
    title: "Computer History Museum",
    markerPosition: {
        lat: 37.414189,
        lng: -122.077441
    }
}, {
    index: 4,
    title: "Mountain View Public Library",
    markerPosition: {
        lat: 37.390310,
        lng: -122.083514
    }
}];



// AJAX REQUEST


function getInfo(search, callback) {
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        data: {
            action: 'query',
            list: 'search',
            srsearch: search,
            format: 'json'
        },
        dataType: 'jsonp',
        success: callback
        // success: function(data) {
        //     var wikiart = data.query.search;
            
        //     info = wikiart[0].snippet;
             
        // }
    });
};


// VIEWMODEL
var ViewModel = function() {
    var self = this;
    var oldIndex;
    this.searchedItem = ko.observable();
    // create observable array and populate
    this.markerList = ko.observableArray([]);
    // populate - review
    if (self.searchedItem() === undefined) {
        markersData.forEach(function(markerItem) {
            self.markerList()[markerItem.index] = markersData[markerItem.index];
        });
    }

    //update List when searched - review?
    this.updateMarkers = function(data, event) {
        self.markerList([]);
        var searched = self.searchedItem().toLowerCase();
        // right index is passed for the new array - for loop?
        var i = 0;
        markersData.forEach(function(markerItem) {
            var place = markerItem.title.toLowerCase();
            if (place.search(searched) != -1) {
                markerItem.index = i;
                i++;
                self.markerList.push(markerItem);
            }
        });
        generateMarker();
    };

    this.currentItem = ko.observable(this.markerList()[this.markerList()[0].index]);
    // selects and animates marker
    this.setSelected = function(data) {
    	
    	self.currentItem(data);
    	animate(oldIndex);
        oldIndex = data.index;
     	getInfo(data.title, function(result) {
     		var info = result.query.search[0].snippet;
     	    animate(data.index, info);
     	});
     	
    };

    // display side nav
    this.display = ko.observable(false);
    this.setDisplay = function() {
        if (!self.display()) {
            self.display(true);
            setTimeout(setCenter, 3000);
            
            } else {
            self.display(false);
        }
    };
};

var viewmodel = new ViewModel();
ko.applyBindings(viewmodel);






// MAP STUFF
// declare global variables
var map;
var markers = [];
var infowindow = {};
var animate;
var generateMarker;
var setCenter;



function initMap() {
    var centerMap = {
        lat: 37.383428,
        lng: -122.066492
    };
    // map
    map = new google.maps.Map(document.getElementById('map'), {
        center: centerMap,
        zoom: 12,
        mapTypeControl: true,
    	mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
    }
    });

    // declare info window - check declaration
    var infowindow = new google.maps.InfoWindow({
    	maxWidth: 200
    });


    // generate markers using markerList
    generateMarker = function() {
        // remove markers
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
        // add markers according to makerList
        for (var i = 0; i < viewmodel.markerList().length; i++) {
            markers.push(new google.maps.Marker({
                position: viewmodel.markerList()[i].markerPosition,
                map: map,
                title: viewmodel.markerList()[i].title,
                animation: google.maps.Animation.DROP
            }));
            // and add event listener so animaion starts and info window start on click
            markers[i].addListener('click', (function(markerCopy) {
                return function() {
                    viewmodel.setSelected(viewmodel.markerList()[markerCopy]);
                };
            })(i));
        }
    };

    generateMarker();

    animate = function(markerNumber, info) {
        if (markerNumber !== undefined) {
            // animation
            if (markerNumber === viewmodel.currentItem().index) {
                markers[markerNumber].setAnimation(google.maps.Animation.BOUNCE);
                // add infowindow

                // getInfo(viewmodel.currentItem().title);
                console.log(info);
            	infowindow.setContent("<div><h3>" + markers[markerNumber].title + "</h3><p>" + info + "</p></div>");
           		infowindow.open(map, markers[markerNumber]);
            } else {
                markers[markerNumber].setAnimation(null);
            }   
        }
    };

    // try to recenter map when list view is hidden - does not work
    // map center is the same according to maps api, but is off center in browser when div grows
    // changed map would be 100% when first loaded, does not solve problem
    var currentCenter = map.getCenter();
    
    setCenter = function() {
    	// console.log(currentCenter);
    	var latLng = new google.maps.LatLng(37.383428, -122.066492);
    	map.setCenter(latLng);
    };
}

// {lat: 37.383428, lng: -122.066492}
// map.setCenter(new google.maps.LatLng(37.383428, 151));
// map sta aligend to center, code from: http://stackoverflow.com/questions/13034188/how-to-center-align-google-maps-in-a-div-with-a-variable-width
$(window).on('resize', function() {
	var currCenter = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currCenter);
})

// $( ".rigth" ).css( "border", "3px solid red" );