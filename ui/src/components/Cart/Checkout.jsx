import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getPaymentIntent } from "../../api/api";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(
  "pk_test_51Qs6WuACPDsvvNfxem8wieeIWOMf7FDRdwepMv7kSRJ9h80oegevnSUyxwEhyq7BbCU5KEwjxdOFptaDUFyeo7s400o1D8zBSi"
);

const Checkout = ({ cartTotal }) => {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        // Call your API to create a payment intent with the cart total
        const secret = await getPaymentIntent(cartTotal);
        console.log(secret);
        setClientSecret(secret); // Assuming the API returns the clientSecret
      } catch (error) {
        console.error("Error fetching client secret", error);
      }
    };

    if (cartTotal > 0) {
      fetchClientSecret();
    }
  }, []);

  if (!clientSecret) {
    return <div>Loading...</div>;
  }

  const appearance = {
    theme: "stripe",
  };
  // Enable the skeleton loader UI for optimal loading.
  const loader = "auto";

  return (
    <div className="checkout-form">
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance, loader }}
      >
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default Checkout;
