import "./App.css";
import GolfBallDisplay from "./components/GolfBallDisplay";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import { CartProvider } from "./components/Cart/CartContext";
import { useState } from "react";
import ViewCartPopup from "./components/Cart/ViewCartPopup";

function App() {
  const [cartPopup, setCartPopup] = useState(false);

  return (
    <>
      <div>
        <CartProvider>
          <Header cartPopup={cartPopup} setCartPopup={setCartPopup} />
          <div className="body">
            <GolfBallDisplay />
            <ViewCartPopup isOpen={cartPopup} setIsOpen={setCartPopup} />
          </div>
        </CartProvider>
      </div>
    </>
  );
}

export default App;
