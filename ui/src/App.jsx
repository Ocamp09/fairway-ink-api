import "./App.css";
import GolfBallDisplay from "./components/GolfBallDisplay";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/Header";

function App() {
  return (
    <>
      <div>
        <Header />
        <div className="body">
          <GolfBallDisplay />
        </div>
      </div>
    </>
  );
}

export default App;
