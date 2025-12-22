import useVisibleSigns from "../../hooks/useVisibleSigns";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState } from "react";

import Sign from "../Sign/Sign";

function VisibleSignsComponent({ signs }) {
  const visibleSigns = useVisibleSigns(signs, 16.5);

  return (
    <>
      {visibleSigns.map((sign) => {
        return (
          <AdvancedMarker key={sign.id} position={sign.coords} zIndex={5}>
            <Sign sign={sign} />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export default VisibleSignsComponent;
