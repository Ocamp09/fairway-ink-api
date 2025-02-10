import { useState } from "react";
import STLViewer from "../3D-View/STLViewer";
import QuantityDropdown from "./QuantityDropdown";
import { useCart } from "../../contexts/CartContext";
import "./PreviewTab.css";

const PreviewTab = ({ stlUrl }) => {
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();

  const handleAddToCart = (event) => {
    event.preventDefault();
    addToCart(stlUrl, quantity);
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
        />
        <button onClick={handleAddToCart} className="submit-button">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default PreviewTab;
