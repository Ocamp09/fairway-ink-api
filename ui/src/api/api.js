import axios from "axios";
import Cookie from "js-cookie";

const API_URL = "http://localhost:5001";
const session_id = Cookie.get("session_id");

export const uploadImage = async (file, method) => {
  const formData = new FormData();
  formData.append("file", file, "fairway_ink_drawing.png");
  formData.append("method", method);

  try {
    const response = await axios.post(API_URL + "/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ssid: session_id,
      },
    });

    if (response.data.success) {
      return response.data; // Return the response data
    } else {
      throw new Error("Upload failed: " + response.data.message);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const generateStl = async (svgData, scale, stlKey, templateType) => {
  const formData = new FormData();
  formData.append(
    "svg",
    new Blob([svgData], { type: "image/svg+xml" }),
    stlKey + "golfball" + ".svg"
  );

  if (templateType === "text") {
    formData.append("scale", scale * 2.5);
  } else {
    formData.append("scale", scale);
  }

  try {
    const response = await axios.post(
      "http://localhost:5001/generate",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ssid: session_id,
          stlKey: stlKey,
        },
      }
    );

    if (response.data.success) {
      return response.data;
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const addToCartApi = (stlUrl) => {
  const formData = new FormData();
  formData.append("filename", stlUrl);

  try {
    axios.post(API_URL + "/cart", formData, {
      headers: {
        "Content-Type": "text/plain",
        ssid: session_id,
      },
    });
  } catch (error) {
    console.log("Err adding to cart: ", error);
    throw error;
  }
};

export const getPaymentIntent = async () => {
  const formData = new FormData();
  formData.append("cart", localStorage.getItem("cart"));

  try {
    const response = await axios.post(
      API_URL + "/create-payment-intent",
      formData,
      {
        headers: {
          "Content-Type": "multi-part/form-data",
        },
      }
    );

    return response.data.clientSecret;
  } catch (error) {
    console.log("Error getting payment intent: ", error);
    throw error;
  }
};
