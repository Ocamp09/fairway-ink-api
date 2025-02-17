import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";

const SelectPreview = ({ setShowSelected, setPrevSvg }) => {
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");

    const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");

    const originalSvg = doc.documentElement;
    newSvg.setAttribute("width", originalSvg.getAttribute("width"));
    newSvg.setAttribute("height", originalSvg.getAttribute("height"));

    selected.forEach((path) => {
      const clonedPath = path.cloneNode();
      clonedPath.setAttribute("fill", "black");
      newSvg.appendChild(clonedPath);
    });

    const updatedSvgData = new XMLSerializer().serializeToString(newSvg);
    return updatedSvgData;
  };

  const submitSelected = () => {
    setPrevSvg(svgData);
    const newSvg = newSelectedSvg();
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
