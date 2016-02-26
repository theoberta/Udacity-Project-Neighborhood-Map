// AJAX Request to foursquare
function getInfo(search, callback) {
	$.ajax({
        url: "https://api.foursquare.com/v2/venues/search?",
        data: {
        	client_id: 
        	client_secret: 
        	v: '20130815',
        	near: "Mountain View",
        	query: search
        },
        success: callback
    });
};


// VIEWMODEL
var ViewModel = function() {
    var self = this;
    var oldIndex;
    this.searchedItem = ko.observable("sushi");
    // create observable array and populate
    this.markerList = ko.observableArray([]);
    

    //update List when searched
    this.updateMarkers = function(data, event) {
    	// empty marker list
    	self.markerList([]);
    	// lowercase serached item from input
    	var searched = self.searchedItem().toLowerCase();
    	// call getInfo
    	getInfo(searched, function(result) {
    		// console.log(result.response.venues);
    		var resultArray = result.response.venues;
    		console.log(resultArray[0]);
    		for (var i = 0; i < resultArray.length; i++) {
    			var x = {};
    			x.index = i;
    			x.title = resultArray[i].name;
    			var lat = resultArray[i].location.lat;
    			var lng = resultArray[i].location.lng;
    			x.markerPosition = {lat, lng};
    			x.url = resultArray[i].url;
                self.markerList.push(x);
	        }
	        generateMarker();	
    	});       
    };

    this.updateMarkers();

    // initial current item
    // TODO: see how knockout accepts two conditions
    var initialObject = {};
    this.currentItem = ko.observable(initialObject);
    this.currentItem().title = "placeholder";

    // this.currentItem = ko.observable();
    // helper observable to set selected class to li
    // this.definedTitle = ko.observable(false);
    // this.isDefinded = function(data) {
    // 	if (self.currentItem().title !== undefined) {
    // 		if (self.currentItem().title === data.title) {
    // 			self.definedTitle = true;
    // 		}
    // 	}
    // };

    // selects and animates marker
    this.setSelected = function(data) {
    	self.currentItem(data);
    	animate(oldIndex);
        oldIndex = data.index;
		animate(data.index);
    };

    // helper observable
    this.displayed = ko.observable(false);
    // display side nav
    this.setDisplay = function() {
        if (!self.displayed()) {
            self.displayed(true);
            setTimeout(setCenter, 3000);
            
            } else {
            self.displayed(false);
        }
    };
};

var viewmodel = new ViewModel();
ko.applyBindings(viewmodel);






// MAP STUFF
// declare global variables so they can be called in viewmodel
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
    var infowindow = new google.maps.InfoWindow({
    	maxWidth: 200
    });


    // generate markers using viewmodel.markerList
    generateMarker = function() {
        // remove markers from map
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        // empty marker array
        markers = [];
        // add markers according to viewmodel.makerList
        for (var i = 0; i < viewmodel.markerList().length; i++) {
            markers.push(new google.maps.Marker({
                position: viewmodel.markerList()[i].markerPosition,
                map: map,
                title: viewmodel.markerList()[i].title,
                animation: google.maps.Animation.DROP
            }));
            // and add event listener so animation starts and infowindow opens by calling setSelected on click
            markers[i].addListener('click', (function(markerCopy) {
                return function() {
                    viewmodel.setSelected(viewmodel.markerList()[markerCopy]);
                };
            })(i));
        }
    };
    // call function for the first time so map is populated with markers on initial view
    generateMarker();

    // animates marker and opens infowindow when called by setSelected
    animate = function(markerNumber) {
        if (markerNumber !== undefined) {
            // animation
            if (markerNumber === viewmodel.currentItem().index) {
                markers[markerNumber].setAnimation(google.maps.Animation.BOUNCE);
                // add infowindow                
            	infowindow.setContent("<div><h3>" + markers[markerNumber].title + "</h3><p>" + viewmodel.currentItem().url + "</p></div>");
           		infowindow.open(map, markers[markerNumber]);
            } else {
                markers[markerNumber].setAnimation(null);
            }   
        }
    };

    // TODO: FIX BUG
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



// error handling
// check if foursquare returend stuff (url)
// same name multiple places get selected in list
// when list is not full - ikea airfield - error line 173
// Uncaught TypeError: Cannot read property 'setAnimation' of undefined
// but sometimes it works