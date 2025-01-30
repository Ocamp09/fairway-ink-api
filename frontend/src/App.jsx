import { useState } from "react";
import "./App.css";
import FileUpload from "./components/FileUpload";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Golf Maker site</h1>
      <FileUpload></FileUpload>
    </>
  );
}

export default App;
