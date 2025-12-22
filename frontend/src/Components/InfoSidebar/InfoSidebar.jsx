import "./InfoSidebar.css";

const InfoSidebar = ({
  show,
  closeSidebar,
  addressData,
  parkAddress,
  confirmPark,
  sidebarType,
  auth,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    confirmPark();
  };

  return (
    <div className={`info-sidebar ${show ? "show-sidebar" : "hide-sidebar"}`}>
      <div onClick={closeSidebar} className={"close-sidebar"}>
        X
      </div>
      <h2>Spot Info</h2>
      <h3>Location</h3>
      {(addressData && sidebarType==="potential") && (
        <>
          <p>{`${addressData.street_num} ${addressData.street_name}`}</p>
          <p>{`${addressData.city}, ${addressData.state} ${addressData.zip}`}</p>
        </>
      )}
      {(parkAddress && sidebarType==="confirmed") && (
        <>
          <p>{`${parkAddress.street_num} ${parkAddress.street_name}`}</p>
          <p>{`${parkAddress.city}, ${parkAddress.state} ${parkAddress.zip}`}</p>
        </>
      )}


      <h3>Parking Laws</h3>
      <p>Street Cleaning: Mon, Thurs 9:30-11:00am (Demo)</p>

      <h3>Status:</h3>
      <p>Safe until 9:30am this Thursday (Demo)</p>
      {(sidebarType === "potential" && auth.isAuthenticated) && (
        <button className={"submit-park"} onClick={handleSubmit}>
          Park My Car Here
        </button>
      )}
      {(sidebarType === "potential" && !auth.isAuthenticated) && (
        <button className={"submit-park"} onClick={ ()=>{auth.signinRedirect()}}>
          Log in to save parking location
        </button>
      )}

      {sidebarType === "confirmed" && <p>You are currently parked here!</p>}
    </div>
  );
};

export default InfoSidebar;
