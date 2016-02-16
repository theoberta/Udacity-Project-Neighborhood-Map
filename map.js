// api key : AIzaSyBdiv9bYXkO-fwLjjWYawwXuOs0E78c29k

// model? data
  var markersData = [
  	{
  		index: 0,
  		title: "Castro street",
  		markerPosition: {
  			lat: 37.388343,
  			lng: -122.082375
  		}
  	},
  	{
  		index: 1,
  		title: "Shoreline Park",
  		markerPosition: {
  			lat: 37.431701,
  			lng: -122.087610
  		}
  	},
  	{
  		index: 2,
  		title: "Farmer\'s Market",
  		markerPosition: {
  			lat: 37.393355,
  			lng: -122.073995
  		}
  	},
  	{
  		index: 3,
  		title: "Computer History Museum",
  		markerPosition: {
  			lat: 37.414189,
  			lng: -122.077441
  		}
  	},
  	{
  		index: 4,
  		title: "Mountain View Public Library",
  		markerPosition: {
  			lat: 37.390310,
  			lng: -122.083514
  		}
  	}
  ];




// VIEWMODEL
var ViewModel = function() {
	var self = this;
	var oldIndex;
	// create observable array and populate
	this.markerList = ko.observableArray([]);
	markersData.forEach(function(markerItem){
		self.markerList()[markerItem.index] = markersData[markerItem.index];
	});

	this.currentItem = ko.observable(this.markerList()[this.markerList()[0].index]);

	this.setSelected = function(data) {
		self.currentItem(data);
		animate(oldIndex);
		animate(data.index);
		oldIndex = data.index;
		}
	// console.log(self.currentItem());
};



var viewmodel = new ViewModel();
ko.applyBindings(viewmodel);





// MAP STUFF
// declare global variables
var map;
var markers = [];
var infowindow = {};
var animate;


function initMap() {
	var centerMap = {lat: 37.383428, lng: -122.066492};
	// map
  	map = new google.maps.Map(document.getElementById('map'), {
    center: centerMap,
    zoom: 12
  });

	// declare info window - check declaration
	var infowindow = new google.maps.InfoWindow({});

	// generate markers - use markerlist???
	// console.log(viewmodel.markerList.length);
	// is 0 - why
	for (var i = 0; i < markersData.length; i++) {
  		markers.push(new google.maps.Marker({
    	position: markersData[i].markerPosition,
    	map: map,
    	title: markersData[i].title,
    	animation: google.maps.Animation.DROP
  		})
  		);

  		// and add event listener so animaion starts and info window start on click
			markers[i].addListener('click', (function(markerCopy) {
  			return function() {
  				viewmodel.setSelected(viewmodel.markerList()[markerCopy]);
  			};
  		})(i));

		}

  	animate = function(markerNumber) {
  				if (markerNumber !== undefined) {
  					// animation
  					if (markerNumber === viewmodel.currentItem().index){
  					markers[markerNumber].setAnimation(google.maps.Animation.BOUNCE);
  					}
  					else {
  						markers[markerNumber].setAnimation(null);
  					}

  					// add infowindow
  					infowindow.setContent("<div><h3>" + markers[markerNumber].title + "</h3><p>info text</p></div>");
  					infowindow.open(map, markers[markerNumber]);
  				}
			};
}

