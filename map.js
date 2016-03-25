// AJAX Request to foursquare
function getInfo(search, callback) {
	$.ajax({
        url: "https://api.foursquare.com/v2/venues/explore?",
        data: {
        	client_id: 
        	client_secret:
        	v: '20130815',
        	near: "Mountain View",
        	query: search
        }
    }).done(callback).fail(function(){alert("oops, there is a problem with loading data from foursquare")});
};



// VIEWMODEL
var ViewModel = function() {
    var self = this;
    // diff var and this ??
    var oldIndex;
    var bestRatings = 0;
    // observable searchedItem
    this.searchedItem = ko.observable();

    // give it the value stored in localStorage or the initial value sushi
    if (localStorage.getItem("searched") != undefined) {
    	self.searchedItem(localStorage.getItem("searched"));
    }
    else {
    	self.searchedItem("sushi");
    }
    
    // create observable array
    this.markerList = ko.observableArray([]);

    // gets called when search button gets pressed or enter is hit
    this.update = function() {
    	self.setLocalStorageSearch();
    	self.updateMarkers();
    }

    // store searched item in localStorage
    this.setLocalStorageSearch = function() {
    	localStorage.setItem("searched", self.searchedItem());
    };

    //update List when searched
    this.updateMarkers = function() {
    	// empty marker list
    	self.markerList([]);
    	// lowercase searched item from input
    	var searched = self.searchedItem().toLowerCase();
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
    			x.markerPosition = {lat, lng};
    			x.id = resultArray[i].venue.id;
    			x.rating = resultArray[i].venue.rating;
    			x.address = resultArray[i].venue.location.address;
    			x.city = resultArray[i].venue.location.city;
                unsortedArray.push(x);
            }
	                
	        // sort Array according to rating
	        var sortedArray = unsortedArray.sort(function (a, b) {
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
	        for (var i = 0; i < sortedArray.length; i++) {
	        	sortedArray[i].index = i;
	        }
	        
	        self.markerList(sortedArray);
	        generateMarker();
	        animate(self.currentItem().index);
	        oldIndex = self.currentItem().index;
    	});       
    };

    this.updateMarkers();
                
    // initiate observable currentItem
     this.currentItem = ko.observable();
     
     // if there is something stored in localStorage, make it the currentItem
    if (localStorage.getItem("current") != undefined) {
    	var storedItem = JSON.parse(localStorage.getItem("current"));
    	self.currentItem(storedItem);
    	// ?? animate - does not work because object is not created?
    	// console.log(self.currentItem());
    }
    // else initiate an empty object
    else {
    	var initialObject = {};
    	self.currentItem(initialObject);
    	self.currentItem().title = "placeholder";
    }
    
    // store searched item in localStorage
    this.setLocalStorageCurrent = function() {
    	localStorage.setItem("current", JSON.stringify(self.currentItem()));
    };

    // select and animate marker
    this.setSelected = function(data) {
    	self.currentItem(data);
    	self.setLocalStorageCurrent();
    	animate(oldIndex);
        oldIndex = data.index;
		animate(data.index);
    };

    // set list scroll to the right place, so selected list item is visible 
    this.setScroll = function() {
    	var element = document.getElementsByClassName("selected");
    	var listDiv = document.getElementsByClassName("left");
    	listDiv[0].scrollTop = element[0].offsetTop - (window.innerHeight / 2);
		};
    
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
};

var viewmodel = new ViewModel();
ko.applyBindings(viewmodel);






// MAP STUFF
// declare global variables so they can be called in Viewmodel
var map;
var markers = [];
var infowindow = {};
var animate;
var generateMarker;
var setCenter;

// generate markers using viewmodel.markerList
    generateMarker = function() {
        // remove existing markers from map
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        // empty marker array
        markers = [];
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

        // add markers according to viewmodel.makerList
        for (var i = 0; i < viewmodel.markerList().length; i++) {
        	var marker = new google.maps.Marker({
                position: viewmodel.markerList()[i].markerPosition,
                map: map,
                title: viewmodel.markerList()[i].title,
                animation: google.maps.Animation.DROP
            });
            // choose marker image according to rating
            if (viewmodel.markerList()[i].rating < ratingAverage || viewmodel.markerList()[i].rating === undefined) {
            	marker.setIcon(image1);
            }
            else {
            	marker.setIcon(image2);
            	marker.setZIndex(1000);
            }
            markers.push(marker);
            // and add event listener so animation starts and infowindow opens by calling setSelected on click
            markers[i].addListener('click', (function(markerCopy) {
                return function() {
                    viewmodel.setSelected(viewmodel.markerList()[markerCopy]);
                    // scroll to the right spot in the list when marker is clicked
                    viewmodel.setScroll();
                };
            })(i));
        }
    };

        // animates marker and opens infowindow when called by setSelected
    animate = function(markerNumber) {
        if (markerNumber !== undefined && markers[markerNumber] !== undefined) {
            // animation
            if (markerNumber === viewmodel.currentItem().index) {
                markers[markerNumber].setAnimation(google.maps.Animation.BOUNCE);
                // define content of infowindow
                var contentString = "<div><h3>" + viewmodel.currentItem().title + "</h3>";
                // check if address, city and rating have a value
                if (viewmodel.currentItem().address !== undefined && viewmodel.currentItem().city !== undefined) {
                	contentString = contentString + "<address>" + viewmodel.currentItem().address + " <br>" + viewmodel.currentItem().city + " </address>";
                }
                if (viewmodel.currentItem().rating !== undefined) {
                	contentString = contentString + "<p class=\"rating\"><span class=\"ratingSpan\">★ </span>" + viewmodel.currentItem().rating + "</p>";
                }
                contentString = contentString + "<a href=\"https://foursquare.com/v/" + viewmodel.currentItem().id + "\">read more</a></div>";

                // set content of infowindow and open               
            	infowindow.setContent(contentString);
           		infowindow.open(map, markers[markerNumber]);
            } else {
            	// check if (old) marker exists, otherwise there will be an error when user searches for venue with little results
                markers[markerNumber].setAnimation(null);
            }   
        }
    };

    // sets center and resizes map       
    setCenter = function() {
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
    generateMarker();

    animate(viewmodel.currentItem().index);
    viewmodel.oldIndex = viewmodel.currentItem().index;

}

// map aligend to center when window resizes, code from: http://stackoverflow.com/questions/13034188/how-to-center-align-google-maps-in-a-div-with-a-variable-width
$(window).on('resize', function() {
	var currCenter = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currCenter);
})

// bug when searching for something new infowindow and markernumber have the same content (in this case not suposed to animate until something gets selected)