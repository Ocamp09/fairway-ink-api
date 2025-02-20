import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";
import InfoPane from "./InfoPane";
import "./SelectPreview.css";

const SelectPreview = () => {
  const {
    updateStage,
    adjustStage,
    updateAdjustStage,
    svgData,
    updateSvgData,
    updatePrevSvgData,
  } = useSession();

  let selected = new Set();

  // Existing selectPath function
  const selectPath = (e) => {
    const selectedPath = e.target;

    if (e.target.localName !== "path") return;

    const fill = selectedPath.getAttribute("fill");
    // if the fill color is the warning color set the opacity for resetting
    if (fill === "#EED202") {
      selectedPath.setAttribute("fill-opacity", 1);
    }

    // if the fill color is not red, set red, else set back to original color
    if (fill == null || fill !== "red") {
      selectedPath.setAttribute("fill", "red");
      selected.add(selectedPath);
    } else {
      // if we set the fill-opacity set back to warning color, else black
      if (selectedPath.getAttribute("fill-opacity") === "1") {
        selectedPath.setAttribute("fill", "#EED202");
      } else {
        selectedPath.setAttribute("fill", "black");
      }
      selected.delete(selectedPath);
    }
  };

  // Existing removeSelectedPaths function
  const removeSelectedPaths = (selected) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");
    const originalSvg = doc.documentElement;
    const paths = doc.querySelectorAll("path");

    const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", originalSvg.getAttribute("width"));
    newSvg.setAttribute("height", originalSvg.getAttribute("height"));

    paths.forEach((path) => {
      var match = false;
      selected.forEach((selctedPath) => {
        if (path.getAttribute("d") == selctedPath.getAttribute("d")) {
          match = true;
        }
      });
      if (!match) {
        const clonedPath = path.cloneNode();
        newSvg.appendChild(clonedPath);
      }
    });

    const updatedSvgData = new XMLSerializer().serializeToString(newSvg);
    return updatedSvgData;
  };

  const handleBackToDesigner = () => {
    updateStage("design");
  };

  // Existing submitSelected function
  const submitSelected = () => {
    updatePrevSvgData(svgData);

    if (selected.size !== 0) {
      const newSvg = removeSelectedPaths(selected);
      updateSvgData(newSvg);
    }
    updateAdjustStage("tab");
  };

  return (
    <div className="select-preview">
      <button
        className="back-button preview-back-button"
        onClick={() => {
          handleBackToDesigner();
        }}
      >
        Back
      </button>
      <h3>Select any curves to remove from design</h3>
      <div className="select">
        {svgData && adjustStage === "remove" && (
          <ReactSVG
            src={`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`}
            onClick={(e) => selectPath(e)}
          />
        )}
        <InfoPane
          warnText="May be problematic to print, remove or create tabs"
          redText="Items to be removed from design"
        />
      </div>
      <button
        className="submit-button"
        onClick={() => {
          submitSelected();
        }}
      >
        Remove selected items
      </button>
    </div>
  );
};

export default SelectPreview;
