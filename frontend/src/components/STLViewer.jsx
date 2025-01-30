import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useLoader } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

const STLModel = ({ url }) => {
  const stl = useLoader(STLLoader, url);
  return (
    <mesh>
      <primitive object={stl} attach="geometry" />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
};

const STLViewer = ({ stlUrl }) => {
  const canvasRef = useRef();

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: [0, 0, 100], fov: 50 }}
      style={{ width: "100%", height: "500px", background: "#f0f0f0" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <STLModel url={stlUrl} />
      <OrbitControls
        enablePan={true} // Allow panning
        enableZoom={true} // Allow zooming
        enableRotate={true} // Allow rotating
      />
    </Canvas>
  );
};

export default STLViewer;
