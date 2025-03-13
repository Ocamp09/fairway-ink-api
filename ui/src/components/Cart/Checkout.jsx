import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getPaymentIntent } from "../../api/api";
import CheckoutForm from "./CheckoutForm";
import "./Checkout.css";

const stripePromise = loadStripe(
  "pk_test_51Qs6WuACPDsvvNfxem8wieeIWOMf7FDRdwepMv7kSRJ9h80oegevnSUyxwEhyq7BbCU5KEwjxdOFptaDUFyeo7s400o1D8zBSi"
);

const Checkout = ({ cartTotal }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const secret = await getPaymentIntent(cartTotal);
        setClientSecret(secret);
      } catch (error) {
        console.error("Error fetching client secret", error);
      } finally {
        setLoading(false); // Set loading to false regardless of success/failure
      }
    };

    if (cartTotal > 0) {
      fetchClientSecret();
    }
  }, [cartTotal]); // Add cartTotal as a dependency

  if (loading) {
    // Check the loading state
    return <div>Loading...</div>;
  }

  if (!clientSecret) {
    // This check is now redundant because of the loading state
    return <div>Error loading payment information.</div>; // More helpful error
  }

  const appearance = {
    theme: "stripe",
  };
  const loader = "auto";

  return (
    <div className="checkout-form">
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance, loader }}
      >
        <h3>Checkout Total: ${cartTotal}</h3>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default Checkout;
