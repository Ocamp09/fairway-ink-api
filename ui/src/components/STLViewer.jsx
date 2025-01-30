import React, { useEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const STLModel = ({ url }) => {
  const stl = useLoader(STLLoader, url);
  return (
    <mesh rotation={[0, 0, Math.PI]}>
      {" "}
      {/* Rotate 180 degrees around the Z-axis */}
      <primitive object={stl} attach="geometry" />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
};

const CameraController = () => {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = true; // Allow panning
    controls.enableZoom = true; // Allow zooming
    controls.enableRotate = true; // Allow rotating
    return () => {
      controls.dispose(); // Clean up on unmount
    };
  }, [camera, gl]);
  return null;
};

const STLViewer = ({ stlUrl }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 100], fov: 50 }}
      style={{ width: "100%", height: "500px", background: "#f0f0f0" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <STLModel url={stlUrl} />
      <CameraController />
    </Canvas>
  );
};

export default STLViewer;
