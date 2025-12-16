import "./CurrentLocationMarker.css"

const CurrentLocationMarker = ()=> {
  return (
    <div className="current-location-marker">
      <div className="pulse" />
      <div className="dot" />
    </div>
  );
}

export default CurrentLocationMarker