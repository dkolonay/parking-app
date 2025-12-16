import { useMap } from "@vis.gl/react-google-maps";
import { useRef, useEffect } from "react";

function AccuracyCircle({ center, radius }) {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (!map || !center) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius,
        clickable: false,
        fillColor: "#1a73e8",
        fillOpacity: 0.15,
        strokeOpacity: 0,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center, radius]);

  return null;
}

export default AccuracyCircle