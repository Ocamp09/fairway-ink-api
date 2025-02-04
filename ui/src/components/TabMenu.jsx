import "./TabMenu.css";
import {
  BsFill1CircleFill,
  BsFill2CircleFill,
  BsFill3CircleFill,
} from "react-icons/bs";

const TabMenu = ({
  showDesign,
  setShowDesign,
  showScale,
  setShowScale,
  showPreview,
  setShowPreview,
}) => {
  return (
    <div className="tab-menu">
      <div
        className="tab-item"
        style={{ color: showDesign ? "blue" : "inherit" }}
      >
        <h3
          className="tab-text"
          onClick={() => {
            setShowDesign(true);
            setShowScale(false);
            setShowPreview(false);
          }}
        >
          <BsFill1CircleFill size={24} className="tab-number" />
          Design
        </h3>
      </div>
      <div
        className="tab-item"
        style={{ color: showScale ? "blue" : "inherit" }}
      >
        <h3
          className="tab-text"
          onClick={() => {
            setShowDesign(false);
            setShowScale(true);
            setShowPreview(false);
          }}
        >
          <BsFill2CircleFill size={24} className="tab-number" />
          Scale
        </h3>
      </div>
      <div
        className="tab-item"
        style={{ color: showPreview ? "blue" : "inherit" }}
      >
        <h3
          className="tab-text"
          onClick={() => {
            setShowDesign(false);
            setShowScale(false);
            setShowPreview(true);
          }}
        >
          <BsFill3CircleFill size={24} className="tab-number" />
          Preview
        </h3>
      </div>
    </div>
  );
};

export default TabMenu;
