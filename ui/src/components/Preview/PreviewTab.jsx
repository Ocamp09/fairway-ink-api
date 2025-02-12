import { useState } from "react";
import STLViewer from "../3D-View/STLViewer";
import QuantityDropdown from "./QuantityDropdown";
import { useCart } from "../../contexts/CartContext";
import { useSession } from "../../contexts/FileContext";
import "./PreviewTab.css";

const PreviewTab = () => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const { addToCart } = useCart();
  const { stlUrl, stlKey } = useSession();

  const handleAddToCart = (event) => {
    event.preventDefault();
    console.log("cartUrl: ", stlUrl);
    addToCart(stlKey, stlUrl, quantity);
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
      </div>
    </div>
  );
};

export default PreviewTab;
