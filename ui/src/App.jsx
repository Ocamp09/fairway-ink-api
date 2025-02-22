import "./App.css";
import GolfBallDisplay from "./components/GolfBallDisplay";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import { CartProvider } from "./contexts/CartContext";
import { FileProvider } from "./contexts/DesignContext";
import { useState } from "react";
import ViewCartPopup from "./components/Cart/ViewCartPopup";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [cartPopup, setCartPopup] = useState(false);

  let sessionId = Cookies.get("session_id");

  if (!sessionId) {
    sessionId = uuidv4();
    Cookies.set("session_id", sessionId, { expires: 1 }); // Expires in 1 day
  }

  return (
    <>
      <FileProvider>
        <CartProvider>
          <Header cartPopup={cartPopup} setCartPopup={setCartPopup} />
          <GolfBallDisplay />
          <ViewCartPopup isOpen={cartPopup} setIsOpen={setCartPopup} />
        </CartProvider>
      </FileProvider>
    </>
  );
}

export default App;
