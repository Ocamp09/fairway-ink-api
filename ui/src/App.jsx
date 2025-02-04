import { useState } from "react";
import "./App.css";
import FileUpload from "./components/FileUpload";
import GolfBallDisplay from "./components/GolfBallDisplay";

function App() {
  const [imageUrl, setImageUrl] = useState(null);

  return (
    <>
      <div className="body">
        <h1>Golf Marker</h1>
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl}></FileUpload>
        <div className="golf-ball-surface">
          <GolfBallDisplay imageUrl={imageUrl} />
        </div>
      </div>
    </>
  );
}

export default App;
