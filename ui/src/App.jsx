import { useState } from "react";
import "./App.css";
import FileUpload from "./components/FileUpload";
import GolfBallDisplay from "./components/GolfBallDisplay";
import TopNav from "./components/TopNav/TopNav";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <>
      <div>
        <TopNav> </TopNav>
        <div className="body">
          <GolfBallDisplay />
        </div>
      </div>
    </>
  );
}

export default App;
