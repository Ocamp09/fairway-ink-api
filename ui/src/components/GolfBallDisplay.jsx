import { useState } from "react";
import "../components/GolfBallDisplay.css";
import ImageEditor from "./Image_Drawing/ImageEditor";
import TabMenu from "./TabMenu";
import ScaleSvg from "./Scale/ScaleSvg";
import PreviewTab from "./Preview/PreviewTab";
import { useSession } from "../contexts/DesignContext";

const GolfBallDisplay = () => {
  const { stage } = useSession();

  return (
    <div className="golf-ball-display">
      <TabMenu />
      {stage === "design" && <ImageEditor />}

      {stage === "scale" && <ScaleSvg />}
      {stage === "preview" && <PreviewTab />}
    </div>
  );
};

export default GolfBallDisplay;
