import React, { useEffect, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import STLViewer from "../3D-View/STLViewer";
import "./ViewCartPopup.css";
import { loadStripe } from "@stripe/stripe-js";
import { getCheckoutSession } from "../../api/api";

const stripePromise = loadStripe(
  "pk_test_51Qs6WuACPDsvvNfxem8wieeIWOMf7FDRdwepMv7kSRJ9h80oegevnSUyxwEhyq7BbCU5KEwjxdOFptaDUFyeo7s400o1D8zBSi"
);

const ViewCartPopup = ({ isOpen, setIsOpen }) => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const [total, setTotal] = useState(0.0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let newTotal = 0;
    cartItems.forEach((item) => {
      newTotal +=
        item.type === "solid" || item.type === "text"
          ? 5.99 * item.quantity
          : 7.99 * item.quantity;
    });
    setTotal(newTotal);
  }, [cartItems]); // Crucial: Add cartItems as a dependency

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const getPrice = (item) => {
    if (item.type === "solid" || item.type === "text") {
      const price = 5.99;
      return price * item.quantity;
    } else {
      const price = 7.99;
      return price * item.quantity;
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Call API to create checkout session and get session ID
      const sessionId = await getCheckoutSession();

      // Redirect the user to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      // If there's an error, show it to the user
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (error) {
      // Handle error from your API or network issues
      setErrorMessage("There was an issue creating your checkout session.");
      console.error("Error during checkout session creation: ", error);
    }
    setLoading(false);
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

                  <p>Item Total: ${getPrice(item).toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="checkout">
          <h3>Cart Total: ${total.toFixed(2)}</h3>
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button
            onClick={handleCheckout}
            className="checkout-button"
            disabled={loading}
          >
            {loading ? "Redirecting to Payment..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCartPopup;
