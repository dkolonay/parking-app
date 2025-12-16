import { useState } from "react";
import "./Sign.css";

const Sign = ({ sign }) => {
  const [hovered, setHovered] = useState(false);

//   if (sign.type == "") return null;
  let icon = "";
  switch (sign.type) {
    case "cleaning":
      icon = "🧹";
      break;
    case "truck":
      icon = "🚚";
      break;
    case "metered":
      icon = "🕑";
      break;
    case "restricted":
      icon = "🚫";
      break;
    case "bus":
      icon = "🚌";
      break;

    default:
      icon = "🅿️";
  }

  return (
    <div
      className={"parking-item"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={"parking-icon"}>{icon}</div>

      {hovered && (
        <div className={"tooltip"}>{sign.text || sign.type || "No text"}</div>
      )}
    </div>
  );
};

export default Sign;
