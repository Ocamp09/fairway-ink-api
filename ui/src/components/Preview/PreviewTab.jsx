import { useState } from "react";
import STLViewer from "../3D-View/STLViewer";
import QuantityDropdown from "./QuantityDropdown";
import { useCart } from "../../contexts/CartContext";
import { useSession } from "../../contexts/DesignContext";
import "./PreviewTab.css";

const PreviewTab = () => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState("");

  const { addToCart } = useCart();
  const { stlUrl, stlKey, templateType } = useSession();

  const handleAddToCart = (event) => {
    event.preventDefault();

    if (stlUrl == "default.stl") {
      setError("No custom design uploaded");
      return;
    }

    addToCart(stlKey, stlUrl, quantity, templateType);
    setIsAdded(true);
  };

  return (
    <div className="stl-viewer">
      <p>3-d Render Preview</p>
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
