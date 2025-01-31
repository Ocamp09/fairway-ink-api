import React, { useRef, useEffect, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import ZoomControls from "./ZoomControls";

const STLModel = ({ url }) => {
  const stl = useLoader(STLLoader, url);
  return (
    <mesh rotation={[0, 0, Math.PI]}>
      <primitive object={stl} attach="geometry" />
      <meshStandardMaterial
        color="lightgray"
        metalness={0.1} // Slightly metallic for a slicer-like appearance
        roughness={0.5} // Slightly rough for better lighting
      />
    </mesh>
  );
};

const CameraController = ({ cameraRef, resetKey }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    cameraRef.current = camera; // Store the camera reference
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;

    // Reset camera position when resetKey changes
    camera.position.set(0, 0, 100); // Reset to default camera position
    controls.update(); // Update the controls to reflect the new camera position

    return () => {
      controls.dispose();
    };
  }, [camera, gl, cameraRef, resetKey]); // Re-run effect when resetKey changes

  return null;
};

const STLViewer = ({ stlUrl }) => {
  const cameraRef = useRef();
  const [resetKey, setResetKey] = useState(0); // Use a key to force re-render

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z -= 10; // Move camera closer
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z += 10; // Move camera farther
    }
  };

  const handleReset = () => {
    // Increment the resetKey to force a re-render of CameraController
    setResetKey((prev) => prev + 1);
  };

  return (
    <div style={{ position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0, 100], fov: 50 }}
        style={{ width: "100%", height: "500px", background: "#f0f0f0" }}
      >
        {/* Add lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />

        {/* Add the STL model */}
        <STLModel url={stlUrl} />

        {/* Add camera controls */}
        <CameraController cameraRef={cameraRef} resetKey={resetKey} />
      </Canvas>
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      {/* Add reset button */}
      <button
        onClick={handleReset}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          padding: "5px 10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Reset View
      </button>
    </div>
  );
};

export default STLViewer;
