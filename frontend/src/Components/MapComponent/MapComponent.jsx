import proj4 from "proj4";
import debounce from "lodash/debounce";
import { Map as GoogleMap, AdvancedMarker, useMap} from "@vis.gl/react-google-maps";
import { useState, useEffect, useRef } from "react";

import "./MapComponent.css";

import CarPin from "../CarPin/CarPin";
import CurrentLocationMarker from "../CurrentLocationMarker/CurrentLocationMarker";
import AccuracyCircle from "../AccuracyCircle/AccuracyCircle";
import VisibleSignsComponent from "../VisibleSigns/VisibleSigns";

const KEY = import.meta.env.VITE_PARK_API_KEY;

const MapComponent = ({ setShowSidebar,setSidebarType, setPotentialParkData, parkLocation }) => {
  const [newMarker, setNewMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [signs, setSigns] = useState(new Map());
  const [accuracy, setAccuracy] = useState(null)
  const map = useMap();

  const watchIdRef = useRef(null);
  const bestAccuracyRef = useRef(Infinity);
  const timeoutRef = useRef(null);

  const hasAnimatedRef = useRef(false);

  const GOOD_ACCURACY = 50;   
  const MAX_WAIT_TIME = 8000;  

  proj4.defs(
  "EPSG:2263",
  "+proj=lcc +lat_1=40.66666666666666 +lat_2=41.03333333333333 "+
    "+lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 "+
    "+y_0=0 +datum=NAD83 +units=us-ft +no_defs"
);

const convertLatLngToStatePlane = (lat, lng) => {
  const [x, y] = proj4("EPSG:4326", "EPSG:2263", [lng, lat]);
  return { x, y };
};

const convertToLatLng = (x, y) => {
  if (
    x == null || y == null ||
    isNaN(Number(x)) || isNaN(Number(y))
  ) {
    console.warn("Invalid coordinates skipped:", x, y);
    return null;
  }
  const [lng, lat] = proj4("EPSG:2263", "EPSG:4326", [Number(x), Number(y)]);
  return { lat, lng };
};

async function fetchParkingSigns(appToken, whereClause) {
  const url = `https://data.cityofnewyork.us/resource/nfid-uabd.json?$where=${encodeURIComponent(whereClause)}&$limit=5000`;
  const res = await fetch(
    url,
    {
      headers: { "X-App-Token": appToken },
    }
  );

  const data = await res.json();

return data
  .map(row => {
    if (!row.sign_x_coord || !row.sign_y_coord) return
    const coords = convertToLatLng(row.sign_x_coord, row.sign_y_coord);
    if (!coords) return null;
    let type = ""
    if (row.sign_description.includes("BUS")){
      type="bus"
    }
    if (row.sign_description.includes("SANITATION")){
      type = "cleaning";
    }
    if (row.sign_description.includes("TRUCK LOADING")){
      type = "truck";
    }

    if (row.sign_description.includes("HMP")){
      type="metered"
    }

    if (row.sign_description.includes("NO PARKING ANYTIME") || row.sign_description.includes("NO STANDING ANYTIME")){
      type="restricted"
    }
    return {
      id: `${row.order_number},${row.sign_x_coord},${row.sign_y_coord}`,
      type: type,
      streets: `${row.from_street}, ${row.to_street}`,
      text: row.sign_description,
      coords
    };
  })
  .filter(Boolean);
}


function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

useEffect(() => {
  if (!map) return;
  const fetchSignsInViewport = async () => {
    if (map.getZoom() < 16.5) {
      return
    };
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const neSP = convertLatLngToStatePlane(ne.lat(), ne.lng());
    const swSP = convertLatLngToStatePlane(sw.lat(), sw.lng());

    const whereClause = `
    sign_x_coord >= ${(swSP.x).toFixed(3)} AND sign_x_coord <= ${(neSP.x).toFixed(3)} AND
    sign_y_coord >= ${(swSP.y).toFixed(3)} AND sign_y_coord <= ${(neSP.y).toFixed(3)}
    `;
    fetchParkingSigns(KEY, whereClause).then((data) => {
      setSigns((prevSigns)=>{
          const updatedSignMap = new Map(prevSigns)
          data.forEach((sign)=>{
            updatedSignMap.set(sign.id, sign)
          })
          for (const [id, sign] of updatedSignMap){
            if (!data.some(s => s.id === id)){
              updatedSignMap.delete(id)
            }
          }
          return updatedSignMap;
      });
    });
  };

  const debouncedFetch = debounce(fetchSignsInViewport, 500)

  const listeners = [
    map.addListener("bounds_changed", debouncedFetch),
    map.addListener("zoom_changed", debouncedFetch)
  ];

  return () => listeners.forEach(l => l.remove());

}, [map]);

useEffect(()=>{
  setNewMarker(null)
}, [parkLocation])



  function smoothPanAndZoom(map, targetLatLng, targetZoom, duration) {
    const startLatLng = map.getCenter();
    const startZoom = map.getZoom();
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Interpolate latitude, longitude, and zoom
      const currentLat =
        startLatLng.lat() + (targetLatLng.lat - startLatLng.lat()) * progress;
      const currentLng =
        startLatLng.lng() + (targetLatLng.lng - startLatLng.lng()) * progress;
      const currentZoom = startZoom + (targetZoom - startZoom) * progress;

      map.moveCamera({
        center: {lat: currentLat, lng: currentLng},
        zoom: currentZoom
      })
      // map.setCenter(new google.maps.LatLng(currentLat, currentLng));
      // map.setZoom(currentZoom);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (accuracy < bestAccuracyRef.current) {
          bestAccuracyRef.current = accuracy;
          setAccuracy(accuracy);
          setUserLocation({ lat: latitude, lng: longitude });
        }

        // Stop if we reached good accuracy
        if (accuracy <= GOOD_ACCURACY) {
          cleanup();
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        cleanup();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    timeoutRef.current = setTimeout(() => {
      cleanup();
    }, MAX_WAIT_TIME);

    return cleanup;
  }, [userLocation]);

    useEffect(() => {
    if (!map || !userLocation || hasAnimatedRef.current) return;

    hasAnimatedRef.current = true; 

    smoothPanAndZoom(map, userLocation, 13, 500);
  }, [map, userLocation]);

  function cleanup() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  const handleMapClick = (e) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    const clickPosition = { lat, lng };
    setNewMarker(clickPosition);
    smoothPanAndZoom(map, clickPosition, 17, 700);

    setPotentialParkData(clickPosition);
    setShowSidebar(true);
    setSidebarType("potential")
  };

  return (
    <GoogleMap
      style={{ width: "100vw", height: "calc(100vh - 70px)" }}
      defaultCenter={{ lat: 40.739691, lng: -73.950848 }}
      defaultZoom={13}
      options={{
        gestureHandling: "greedy",
        draggableCursor: "pointer",
      }}
      disableDefaultUI
      onClick={handleMapClick}
      mapId={"adb4347623e9a8d3e95db32d"}
    >
      {newMarker && (
        <AdvancedMarker
          onClick={() => {
            setShowSidebar(true);
            setSidebarType("potential")
            smoothPanAndZoom(map, newMarker, 17, 600)
          }}
          position={newMarker}
        >
          <CarPin type={'potential'}/>
        </AdvancedMarker>
      )}
      {parkLocation && (
        <AdvancedMarker
          onClick={() => {
            setShowSidebar(true);
            setSidebarType("confirmed")
            smoothPanAndZoom(map, parkLocation, 17, 600)
          }}
          position={parkLocation}
        >
          <CarPin type={'confirmed'}/>
        </AdvancedMarker>
      )}
      {userLocation && (<><AdvancedMarker position={userLocation}>
        
        <CurrentLocationMarker/>
        </AdvancedMarker>
         {accuracy && (
            <AccuracyCircle center={userLocation} radius={accuracy}/>
          )}

        </>)}

        <VisibleSignsComponent signs={signs}/>
      {parkLocation && (
        <div className={"pan-to-car-button"}>
          <button className={'location-button'} onClick={()=>{smoothPanAndZoom(map, parkLocation, 17, 600)}}>Where's my car?</button>
        </div>
      )}

      {userLocation && (
        <div className={"pan-to-user-button"}>
          <button className={'location-button'} onClick={()=>{smoothPanAndZoom(map, userLocation, 17, 600)}}>Show my location</button>
        </div>
      )}
        
      
    </GoogleMap>
  );
};

export default MapComponent;
