import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";

const SelectPreview = () => {
  const {
    updateStage,
    scaleStage,
    updateScaleStage,
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
    if (fill == null || fill === "black") {
      selectedPath.setAttribute("fill", "red");
      selected.add(selectedPath);
    } else {
      selectedPath.setAttribute("fill", "black");
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
    updateScaleStage("tab");
  };

  return (
    <div>
      <button
        className="back-button"
        onClick={() => {
          handleBackToDesigner();
        }}
      >
        Back
      </button>
      <h3>Select any curves to remove from design</h3>
      {svgData && scaleStage === "remove" && (
        <ReactSVG
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`}
          onClick={(e) => selectPath(e)}
        />
      )}
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
