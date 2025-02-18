import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";

const SelectPreview = ({ setShowSelected }) => {
  const { svgData, updateSvgData, updatePrevSvgData } = useSession();
  let selected = new Set();
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

  // leave this in case of future implementation
  // const newSelectedSvg = (selected) => {
  //   const parser = new DOMParser();
  //   const doc = parser.parseFromString(svgData, "image/svg+xml");

  //   const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");

  //   const originalSvg = doc.documentElement;
  //   newSvg.setAttribute("width", originalSvg.getAttribute("width"));
  //   newSvg.setAttribute("height", originalSvg.getAttribute("height"));

  //   selected.forEach((path) => {
  //     const clonedPath = path.cloneNode();
  //     clonedPath.setAttribute("fill", "black");
  //     newSvg.appendChild(clonedPath);
  //   });

  //   const updatedSvgData = new XMLSerializer().serializeToString(newSvg);
  //   return updatedSvgData;
  // };

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

  const submitSelected = () => {
    updatePrevSvgData(svgData);

    if (selected.size !== 0) {
      const newSvg = removeSelectedPaths(selected);
      updateSvgData(newSvg);
    }
    setShowSelected(true);
  };

  return (
    <div>
      {svgData && (
        <ReactSVG
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`} // Pass SVG data
          onClick={(e) => selectPath(e)}
        />
      )}
      <h3>Select any curves to remove from design</h3>
      <button
        className="submit-button"
        onClick={() => {
          submitSelected();
        }}
      >
        Proceed to Scale Image
      </button>
    </div>
  );
};

export default SelectPreview;
