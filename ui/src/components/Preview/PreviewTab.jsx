import { useState } from "react";
import STLViewer from "../3D-View/STLViewer";
import QuantityDropdown from "./QuantityDropdown";
import { useCart } from "../../contexts/CartContext";
import { useSession } from "../../contexts/DesignContext";
import { addToCartApi } from "../../api/api";
import "./PreviewTab.css";

const PreviewTab = () => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState("");

  const { addToCart } = useCart();
  const {
    updateSvgData,
    prevSvgData,
    stlUrl,
    stlKey,
    templateType,
    updateStage,
  } = useSession();

  const handleBack = () => {
    updateStage("scale");
    updateSvgData(prevSvgData);
  };

  const handleAddToCart = (event) => {
    event.preventDefault();

    if (stlUrl == "default.stl") {
      setError("No custom design uploaded");
      return;
    }
    addToCartApi(stlUrl);
    addToCart(stlKey, stlUrl, quantity, templateType);
    setIsAdded(true);
  };

  return (
    <div className="stl-viewer">
      <button
        className="back-button"
        onClick={() => {
          handleBack();
        }}
      >
        Back
      </button>
      <p>3-D Render Preview</p>
      {stlUrl && <STLViewer stlUrl={stlUrl} />}
      <div>
        <QuantityDropdown
          setQuantity={setQuantity}
          quantity={quantity}
          maxQuantity={15}
          hidden={isAdded}
        />
        <button
          onClick={handleAddToCart}
          className="submit-button"
          disabled={isAdded}
        >
          {!isAdded ? "Add to Cart" : "Item added!"}
        </button>
        {error && <p className="file-error-message">{error}</p>}
      </div>
    </div>
  );
};

export default PreviewTab;
