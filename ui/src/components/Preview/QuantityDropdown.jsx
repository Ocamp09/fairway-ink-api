import React, { useState } from "react";

function QuantityDropdown({ setQuantity, quantity, maxQuantity = 15 }) {
  const handleQuantityChange = (event) => {
    setQuantity(parseInt(event.target.value, 10));
  };

  return (
    <div>
      <label htmlFor="quantitySelect">Quantity:</label>
      <select
        id="quantitySelect"
        value={quantity}
        onChange={handleQuantityChange}
      >
        {Array.from({ length: maxQuantity }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
}

export default QuantityDropdown;
