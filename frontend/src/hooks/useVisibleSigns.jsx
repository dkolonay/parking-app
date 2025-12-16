import { useMap } from "@vis.gl/react-google-maps";
import {useState, useEffect} from "react"

function useVisibleSigns(signs, minZoom = 16.5) {
  const map = useMap();
  const [visibleSigns, setVisibleSigns] = useState([]);


  useEffect(() => {
    if (!map) return;

    const updateVisible = () => {
      if (map.getZoom() < minZoom) {
        setVisibleSigns([]);
        return;
      }

      const bounds = map.getBounds();
      if (!bounds) return;

      const signsArray = Array.from(signs.values());

      const filtered = signsArray.filter((s) => bounds.contains(s.coords));
      setVisibleSigns(filtered);
    };

    updateVisible(); // initial
    const listeners = [
      map.addListener("bounds_changed", updateVisible),
      map.addListener("zoom_changed", updateVisible),
    ];

    return () => listeners.forEach((l) => l.remove());
  }, [map, signs, minZoom]);

  return visibleSigns;
}

export default useVisibleSigns