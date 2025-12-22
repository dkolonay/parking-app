import { APIProvider } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import Navbar from "../Components/Navbar/Navbar";
import MapComponent from "../Components/MapComponent/MapComponent";
import InfoSidebar from "../Components/InfoSidebar/InfoSidebar";
import axios from "axios";
import "./Home.css";

const KEY = import.meta.env.VITE_MAPS_API_KEY;

const Home = ({ auth }) => {
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarType, setSidebarType] = useState(null)
  const [potentialParkData, setPotentialParkData] = useState(null)
  const [addressData, setAddressData] = useState(null)
  const [parkLocation, setParkLocation] = useState(null)
  const [parkAddress, setParkAddress] = useState(null)

  const getAuthHeaders = ()=>{
    if (auth.isAuthenticated){
      return {Authorization: `Bearer ${auth.user.access_token}`}
    } else {
      throw new Error("User must be authenticated to save parking data")
    }
  }

  async function confirmPark() {
  try {
    const response = await fetch("https://pmiexhnze6.execute-api.us-west-2.amazonaws.com/api/parking-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),  // adds Authorization: Bearer <JWT>
      },
      body: JSON.stringify(potentialParkData),
    });

    const data = await response.json();
    if (data.success) {
      setParkLocation(data.location)
      setPotentialParkData(null)
      setSidebarType("confirmed")
    } else {
      console.error("Error saving location:", data);
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

async function fetchSavedParkLocation() {
  try {
    const response = await fetch(
      "https://pmiexhnze6.execute-api.us-west-2.amazonaws.com/api/parking-location",
      {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      console.log("No saved parking location found");
      return null;
    }

    setParkLocation({
      lat: data.lat,
      lng: data.lng,
    });

    return data;
  } catch (err) {
    console.error("Failed to fetch parking location:", err);
    return null;
  }
}

function cleanAuthParamsFromUrl() {
  const url = new URL(window.location.href);

  if (url.searchParams.has('code') || url.searchParams.has('state')) {
    url.searchParams.delete('code');
    url.searchParams.delete('state');

    window.history.replaceState(
      {},
      document.title,
      url.pathname + url.search
    );
  }
}


useEffect(()=>{
  if(auth.isAuthenticated){
    cleanAuthParamsFromUrl()
    fetchSavedParkLocation()
  }
}, [auth.isAuthenticated])



    useEffect(()=>{
      if(parkLocation){
        (async ()=>{
      try{
        const response = await axios.get(`https://pmiexhnze6.execute-api.us-west-2.amazonaws.com/api/map/address-from-coords/${parkLocation.lat},${parkLocation.lng}`);
        setParkAddress(response.data)
      } catch(err){
        console.error(err);
      }
    })();
      }
    
  }, [parkLocation])
    useEffect(()=>{
      if(potentialParkData){
        (async ()=>{
      try{
        const response = await axios.get(`https://pmiexhnze6.execute-api.us-west-2.amazonaws.com/api/map/address-from-coords/${potentialParkData.lat},${potentialParkData.lng}`);
        setAddressData(response.data)
      } catch(err){
        console.error(err);
      }
    })();
      }
    
  }, [potentialParkData])

  return (
    <div className={"page-container"}>
      <Navbar auth={auth} />
      <InfoSidebar auth={auth} show={showSidebar} sidebarType={sidebarType} closeSidebar={()=>{setShowSidebar(false)}} addressData={addressData} parkAddress={parkAddress} confirmPark={confirmPark}/>
      <APIProvider apiKey={KEY}>
        <MapComponent setShowSidebar={setShowSidebar} setSidebarType={setSidebarType} setPotentialParkData={setPotentialParkData} parkLocation={parkLocation}/>
      </APIProvider>
    </div>
  );
};

export default Home;
