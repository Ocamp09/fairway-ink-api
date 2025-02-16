import { ReactSVG } from "react-svg";

const SelectPreview = ({ svgData }) => {
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

  const submitSelected = () => {
    // setShowSelected(true);
    console.log(selected);
  };

  return (
    <div>
      {svgData && (
        <ReactSVG
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`} // Pass SVG data
          onClick={(e) => selectPath(e)}
        />
      )}

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
