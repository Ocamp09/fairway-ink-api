import "./App.css";
import GolfBallDisplay from "./components/GolfBallDisplay";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import { CartProvider } from "./contexts/CartContext";
import { FileProvider } from "./contexts/FileContext";
import { useState } from "react";
import ViewCartPopup from "./components/Cart/ViewCartPopup";

function App() {
  const [cartPopup, setCartPopup] = useState(false);

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
