import "./App.css";
import GolfBallDisplay from "./components/GolfBallDisplay";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";
import { CartProvider } from "./components/CartContext";

function App() {
  return (
    <>
      <div>
        <CartProvider>
          <Header />
          <div className="body">
            <GolfBallDisplay />
          </div>
        </CartProvider>
      </div>
    </>
  );
}

export default App;
