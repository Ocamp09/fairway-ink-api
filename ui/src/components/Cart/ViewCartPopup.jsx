import React, { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import STLViewer from "../3D-View/STLViewer";
import "./ViewCartPopup.css";

const ViewCartPopup = ({ isOpen, setIsOpen }) => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  let total = 0.0;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const getPrice = (item) => {
    if (item.type === "solid" || item.type === "text") {
      const price = 4.99;
      total += price * item.quantity;
      return price * item.quantity;
    }
    return 0;
  };

  const handleCheckout = () => {
    console.log("checkout");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="view-cart-overlay">
      <div className="view-cart-popup">
        <button
          className="close-button"
          onClick={() => {
            setIsOpen(false);
          }}
        >
          X
        </button>
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul className="cart-items">
            {cartItems.map((item) => (
              <li key={item.stl} className="cart-item">
                <div className="stl-viewer-container">
                  <STLViewer stlUrl={item.stl} cart={true} />{" "}
                </div>
                <div className="item-details">
                  <div className="quantity">
                    <p>Quantity:</p>

                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>

                  <p>Item Total: ${getPrice(item)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="checkout">
          <h3>Cart Total: ${total}</h3>
          <button onClick={handleCheckout} className="checkout-button">
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCartPopup;
