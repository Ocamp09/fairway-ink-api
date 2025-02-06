import React, { useState } from "react";
import "./QuantityDropdown.css";

function QuantityDropdown({
  setQuantity,
  quantity,
  maxQuantity = 15,
  labelText = "Quantity: ",
  step = 1,
}) {
  const handleQuantityChange = (event) => {
    setQuantity(parseInt(event.target.value, 10));
  };

  return (
    <div className="dropdown">
      <label htmlFor="quantitySelect">{labelText}</label>
      <select
        id="quantitySelect"
        value={quantity}
        onChange={handleQuantityChange}
      >
        {(() => {
          const options = [];
          for (let i = 1; i <= maxQuantity; i += step) {
            options.push(
              <option key={i} value={i}>
                {i}
              </option>
            );
          }
          return options;
        })()}
      </select>
    </div>
  );
}

export default QuantityDropdown;
