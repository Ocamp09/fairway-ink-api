import { useEffect } from "react";
import { useSession } from "../contexts/DesignContext";

export const useCanvasEvents = (
  canvasRef,
  handleStartDrawing,
  handleMoveDrawing,
  handleStopDrawing
) => {
  const { updateImageUrl } = useSession();

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          updateImageUrl(event.target.result);
          sessionStorage.setItem("imageUrl", event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };

    canvas.addEventListener("dragenter", handleDragEnter);
    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("dragleave", handleDragLeave);
    canvas.addEventListener("drop", handleDrop);

    const handleTouchStart = (e) => handleStartDrawing(e);
    const handleTouchMove = (e) => handleMoveDrawing(e);
    const handleTouchEnd = () => handleStopDrawing();

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("dragenter", handleDragEnter);
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("dragleave", handleDragLeave);
      canvas.removeEventListener("drop", handleDrop);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    canvasRef,
    handleStartDrawing,
    handleMoveDrawing,
    handleStopDrawing,
    updateImageUrl,
  ]);
};
