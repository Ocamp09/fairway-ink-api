import { useState } from "react";
import "./App.css";
import FileUpload from "./components/FileUpload";

function App() {
  return (
    <>
      <div>
        <h1>Golf Marker</h1>
        <FileUpload></FileUpload>
      </div>
    </>
  );
}

export default App;
