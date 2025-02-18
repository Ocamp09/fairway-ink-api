import { useEffect, useState } from "react";
import ImageScaler from "./ImageScaler";
import { useSession } from "../../contexts/DesignContext";
import "./ScaleSvg.css";
import { generateStl } from "../../api/api";
import SelectPreview from "./SelectPreview";

const ScaleSvg = () => {
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelected, setShowSelected] = useState(false);
  const [svgUrl, setSvgUrl] = useState("");

  const {
    updateStage,
    svgData,
    prevSvgData,
    updateSvgData,
    updateStl,
    stlKey,
    updateStlKey,
    templateType,
  } = useSession();

  // Get SVG width and height, scale down to size I want to display
  // Then factor that scale into the query sent
  let canvasSizePx;
  if (templateType === "text") {
    canvasSizePx = 110 * scale * 2.5;
  } else {
    canvasSizePx = 110 * scale;
  }

  const handleBack = () => {
    setShowSelected(false);
    updateSvgData(prevSvgData);
  };

  const handleBackDesigner = () => {
    updateStage("design");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!svgData) {
      setError("Please draw an image and convert it");
      return;
    }

    setIsLoading(true);
    updateStl("default.stl");

    try {
      const response = await generateStl(svgData, scale, stlKey, templateType);

      updateStl(response.stlUrl);
      updateStlKey();
      updateStage("preview");
    } catch (err) {
      setError("An error occurred while uploading the file, try again later");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const blobSvg = new Blob([svgData], {
      type: "image/svg+xml",
    });

    const url = URL.createObjectURL(blobSvg);
    setSvgUrl(url);
  }, [svgData]);

  return (
    <div className="scale-svg">
      {templateType === "custom" && !showSelected && (
        <SelectPreview
          setShowSelected={setShowSelected}
          setPrevSvg={updateSvgData}
        />
      )}
      {templateType === "custom" && showSelected && (
        <button
          className="back-button"
          onClick={() => {
            handleBack();
          }}
        >
          Back
        </button>
      )}
      {!showSelected && (
        <button
          className="back-button"
          onClick={() => {
            handleBackDesigner();
          }}
        >
          Back
        </button>
      )}
      {(templateType !== "custom" || showSelected) && (
        <>
          <p>Scale the image to the desired size</p>
          <div className="ball-displays">
            <div className="golf-template">
              <img
                src={svgUrl}
                alt="Uploaded"
                className="upload-img"
                style={{
                  width: `${canvasSizePx}px`, // Set width based on scale
                }}
              />
            </div>
            <div>
              <p>Life Size</p>
              <div className="golf-real-size">
                <img
                  src={svgUrl}
                  alt="Uploaded"
                  className="upload-img"
                  style={{
                    width: `${(canvasSizePx * 210) / 500}px`, // Set width based on scale
                  }}
                />
              </div>
            </div>
          </div>
          <ImageScaler scale={scale} setScale={setScale}></ImageScaler>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "3-D Preview"}
            </button>
            {error && <p className="file-error-message">{error}</p>}
          </form>
        </>
      )}
    </div>
  );
};

export default ScaleSvg;
