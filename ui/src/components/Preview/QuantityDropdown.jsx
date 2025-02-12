import React, { useState, useRef, useEffect } from "react";
import "./QuantityDropdown.css";

function QuantityDropdown({
  setQuantity,
  quantity,
  minQuantity = 1,
  maxQuantity = 15,
  labelText = "Quantity: ",
  step = 1,
  title = "Set quantity",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const quantities = [];
  for (let i = minQuantity; i <= maxQuantity; i += step) {
    quantities.push(i);
  }

  const handleSelectQuantity = (value) => {
    setQuantity(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="dropdown" title={title} ref={dropdownRef}>
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        <label>{labelText}</label>
        {quantity}
      </button>

      {isOpen && (
        <ul className="dropdown-list">
          {quantities.map((qty) => (
            <li
              key={qty}
              className={quantity === qty ? "selected" : ""}
              onClick={() => handleSelectQuantity(qty)}
            >
              {qty}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuantityDropdown;
