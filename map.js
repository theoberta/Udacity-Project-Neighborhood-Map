// api key : AIzaSyBdiv9bYXkO-fwLjjWYawwXuOs0E78c29k

var map;
var centerMap = {lat: 37.383428, lng: -122.066492};
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: centerMap,
    zoom: 12
  });

  var markersData = [
  	{
  		title: "Castro street",
  		markerPosition: {
  			lat: 37.388343,
  			lng: -122.082375
  		}
  	},
  	{
  		title: "Shoreline Park",
  		markerPosition: {
  			lat: 37.431701,
  			lng: -122.087610
  		}
  	},
  	{
  		title: "Farmer\'s Market",
  		markerPosition: {
  			lat: 37.393355,
  			lng: -122.073995
  		}
  	},
  	{
  		title: "Computer History Museum",
  		markerPosition: {
  			lat: 37.414189,
  			lng: -122.077441
  		}
  	},{
  		title: "Mountain View Public Library",
  		markerPosition: {
  			lat: 37.390310,
  			lng: -122.083514
  		}
  	},
  ];


var markers = [];

var infowindow = new google.maps.InfoWindow({
	content: ""
  });

	for (var i = 0; i < markersData.length; i++) {
  		markers.push(new google.maps.Marker({
    	position: markersData[i].markerPosition,
    	map: map,
    	title: markersData[i].title,
    	animation: google.maps.Animation.DROP
  		})
  		);

  		markers[i].addListener('click', (function(markerCopy) {
  			return function() {
	  			if (markers[markerCopy].getAnimation() !== null) {
    				markers[markerCopy].setAnimation(null);
  				}
  				else {
    				markers[markerCopy].setAnimation(google.maps.Animation.BOUNCE);
  				}
  				infowindow.setContent("<div><h3>" + markers[markerCopy].title + "</h3><p>info text</p></div>");
  				console.log(infowindow.content);
  				infowindow.open(map, markers[markerCopy]);
  			};
  		})(i));


  	}


}

