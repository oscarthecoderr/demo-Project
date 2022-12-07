let buttons = document.querySelectorAll(".get");
let hideMaps = true;
buttons.forEach((button) => button.addEventListener("click", showMap));

if (hideMaps) {
  let maps = document.querySelectorAll(".mapsData");
  maps.forEach((map) => (map.style.display = "none"));
}

let directionsBtn = document.querySelectorAll(".get-directions");

function showMap(e) {
  hideMaps = false;
  if (!hideMaps) {
    let maps = document.querySelectorAll(".mapsData");
    maps.forEach((map) => (map.style.display = "flex"));
  }

  // set map options, we're going to start the map in boston
  const coordinates = { lat: 42.361145, lng: -71.057083 };
  const mapOptions = {
    center: coordinates,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  // creating our map

  let parentNode = e.target.parentNode.childNodes[3];
  let mapNode = parentNode.childNodes[1];
  let mapElement = mapNode.childNodes[7];

  const map = new google.maps.Map(mapElement, mapOptions);
  directionsBtn.forEach((button) =>
    button.addEventListener("click", (e) => {
      let destination = e.target.dataset.location;
      getMap(map, destination, coordinates, mapElement);
    })
  );
}

function getMap(map, destination, coordinates, mapElement) {
  // getting directions
  var directionsService = new google.maps.DirectionsService();

  //create a DirectionsRenderer object which we will use to display the directions
  var directionsDisplay = new google.maps.DirectionsRenderer();

  //attach the DirectionsRenderer to the map
  directionsDisplay.setMap(map);

  getRoute(
    directionsDisplay,
    directionsService,
    map,
    coordinates,
    destination,
    mapElement
  );
}

function getRoute(
  directionsDisplay,
  directionsService,
  map,
  coordinates,
  destination,
  mapElement
) {
  const fromParent = mapElement.parentNode.childNodes[1];
  const from = fromParent.childNodes[3].value;
  const to = destination;

  // make a request in the format google api needs
  const request = {
    origin: from,
    destination: to,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  };

  // send the request to google api's route method
  directionsService.route(request, (result, status) => {
    if (status == google.maps.DirectionsStatus.OK) {
      // if everythings good, then get the distance and time it'll take to get there
      console.log(result, "result");
      const distanceInMiles = result.routes[0].legs[0].duration.text;
      const steps = result.routes[0].legs[0].steps;
      const ul = mapElement.parentNode.childNodes[11];
      for (let i = 0; i < steps.length; i++) {
        let instruction = document.createElement("li");
        instruction.innerHTML = steps[i].instructions;
        ul.appendChild(instruction);
      }

      const output = mapElement.parentNode.childNodes[9];
      output.innerText = `It'll take you ${distanceInMiles} to get from ${from} to ${to}.`;
      output.parentNode.parentNode.style.height = "auto";
      output.parentNode.parentNode.style.overflow = "scroll";
      //display route
      directionsDisplay.setDirections(result);
    } else {
      //delete route from map

      directionsDisplay.setDirections({ routes: [] });

      //recenter map in Boston
      map.setCenter(coordinates);

      //show error message
      output.innerText = "Could not retrieve driving distance.";
    }
  });
  console.log(request, "what we send to the api");
}

let input1Array = document.querySelectorAll("#from");
input1Array.forEach((input1) => {
  new google.maps.places.Autocomplete(input1);
});

let input2Array = document.querySelectorAll("#to");
input2Array.forEach((input2) => {
  new google.maps.places.Autocomplete(input2);
});
