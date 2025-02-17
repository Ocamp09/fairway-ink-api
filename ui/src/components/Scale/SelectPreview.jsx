import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";

const SelectPreview = ({ setShowSelected }) => {
  const { svgData, updateSvgData } = useSession();
  let selected = new Set();
  const selectPath = (e) => {
    const selectedPath = e.target;

    if (e.target.localName !== "path") return;

    const fill = selectedPath.getAttribute("fill");
    if (fill == null || fill === "black") {
      selectedPath.setAttribute("fill", "blue");
      selected.add(selectedPath);
    } else {
      selectedPath.setAttribute("fill", "black");
      selected.delete(selectedPath);
    }
  };

  const newSelectedSvg = () => {
    // Parse the original svgData into a DOM object
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");

    // Create a new SVG element to hold the selected paths
    const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");

    const originalSvg = doc.documentElement;
    newSvg.setAttribute("width", originalSvg.getAttribute("width"));
    newSvg.setAttribute("height", originalSvg.getAttribute("height"));

    // Append selected paths to the new SVG element
    selected.forEach((path) => {
      // Clone the selected path to avoid altering the original SVG data
      const clonedPath = path.cloneNode();
      clonedPath.setAttribute("fill", "black");
      newSvg.appendChild(clonedPath);
    });

    // Serialize the new SVG to a string
    const updatedSvgData = new XMLSerializer().serializeToString(newSvg);
    // Return the updated SVG string
    return updatedSvgData;
  };

  const submitSelected = () => {
    // setShowSelected(true);
    const newSvg = newSelectedSvg();
    console.log(newSvg);
    updateSvgData(newSvg);
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
      <h3>Select curves to keep in design</h3>

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
