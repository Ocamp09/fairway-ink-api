import { useEffect } from "react";

export const useCanvasScaling = (canvasRef, setCanvasScale) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const initialWidth = 500;

    const calculateCanvasScale = () => {
      const currentWidth = canvas.offsetWidth;
      const scale = currentWidth / initialWidth;
      setCanvasScale(scale);
    };

    calculateCanvasScale();
    window.addEventListener("resize", calculateCanvasScale);

    return () => {
      window.removeEventListener("resize", calculateCanvasScale);
    };
  }, [canvasRef, setCanvasScale]);
};
