import "../components/GolfBallDisplay.css";
import { useState } from "react";
import ImageEditor from "./Image_Drawing/ImageEditor";
import TabMenu from "./TabMenu";
import ScaleSvg from "./Scale/ScaleSvg";
import PreviewTab from "./Preview/PreviewTab";

const GolfBallDisplay = () => {
  const [svgUrl, setSvgUrl] = useState(null);
  const [svgData, setSvgData] = useState(null);
  const [showDesign, setShowDesign] = useState(true);
  const [showScale, setShowScale] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [paths, setPaths] = useState([]);

  return (
    <div className="golf-ball-display">
      <TabMenu
        showDesign={showDesign}
        setShowDesign={setShowDesign}
        showScale={showScale}
        setShowScale={setShowScale}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />
      {showDesign && (
        <ImageEditor
          setSvgUrl={setSvgUrl}
          setSvgData={setSvgData}
          setShowDesign={setShowDesign}
          setShowScale={setShowScale}
          showDesign={showDesign}
          paths={paths}
          setPaths={setPaths}
        />
      )}

      {showScale && (
        <ScaleSvg
          svgUrl={svgUrl}
          svgData={svgData}
          setSvgData={setSvgData}
          setShowPreview={setShowPreview}
          setShowScale={setShowScale}
        />
      )}
      {showPreview && <PreviewTab />}
    </div>
  );
};

export default GolfBallDisplay;
