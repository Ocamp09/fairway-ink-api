import "./TabMenu.css";
import {
  BsFill1CircleFill,
  BsFill2CircleFill,
  BsFill3CircleFill,
} from "react-icons/bs";
import { useSession } from "../contexts/DesignContext";

const TabMenu = () => {
  const { stage, updateStage } = useSession();
  return (
    <div className="tab-menu">
      <div className={stage === "design" ? "active" : ""}>
        <h3
          onClick={() => {
            updateStage("design");
          }}
        >
          <BsFill1CircleFill size={24} className="tab-number" />
          Design
        </h3>
      </div>
      <div className={stage === "adjust" ? "active" : ""}>
        <h3
          onClick={() => {
            updateStage("adjust");
          }}
        >
          <BsFill2CircleFill size={24} className="tab-number" />
          Scale
        </h3>
      </div>
      <div className={stage === "preview" ? "active" : ""}>
        <h3
          className="tab-text"
          onClick={() => {
            updateStage("preview");
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
