import getStroke from "perfect-freehand";

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

export const getCoordinates = (e, canvasRef, canvasScale) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.clientX) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return null;
  }

  const x = (clientX - rect.left) / canvasScale;
  const y = (clientY - rect.top) / canvasScale;
  const pressure = e.pressure || 1;

  return { x, y, pressure };
};

export const centerCanvasDrawing = (canvas) => {
  // Create a temporary canvas to calculate the bounding box
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");

  // Draw the current canvas content onto the temporary canvas
  tempCtx.drawImage(canvas, 0, 0);

  // Get the image data from the temporary canvas
  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const data = imageData.data;

  // Calculate the bounding box of the drawn content
  let minX = tempCanvas.width;
  let minY = tempCanvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < tempCanvas.height; y++) {
    for (let x = 0; x < tempCanvas.width; x++) {
      const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
      if (alpha > 0) {
        // Non-transparent pixel found
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Calculate the center of the drawn content
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const centerX = (tempCanvas.width - contentWidth) / 2;
  const centerY = (tempCanvas.height - contentHeight) / 2;

  // Create a new canvas to draw the centered content
  const centeredCanvas = document.createElement("canvas");
  centeredCanvas.width = canvas.width;
  centeredCanvas.height = canvas.height;
  const centeredCtx = centeredCanvas.getContext("2d");

  // Fill the background with white
  centeredCtx.fillStyle = "white";
  centeredCtx.fillRect(0, 0, centeredCanvas.width, centeredCanvas.height);

  // Translate and draw the content onto the centered canvas
  centeredCtx.translate(centerX - minX, centerY - minY);
  centeredCtx.drawImage(canvas, 0, 0);

  return centeredCanvas;
};

export const drawImage = (
  edit,
  imageUrl,
  canvasRef,
  setPaths,
  setReloadPaths,
  templateType
) => {
  if (templateType === "text") return;
  if (imageUrl) {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const width = img.width;
      const height = img.height;
      const set_dimension = 425;

      let scale =
        width > height ? set_dimension / width : set_dimension / height;

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      if (!edit) setPaths([]);

      context.drawImage(img, x, y, scaledWidth, scaledHeight);

      setReloadPaths(false);
    };
  }
};

export const drawPaths = (
  canvasRef,
  paths,
  templateType,
  selectedPathIndex
) => {
  if (paths.length === 0) return; // early exit if there are no paths

  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  paths.forEach((path, index) => {
    const drawText = () => {
      if (path.type === "text") {
        writeText(
          canvasRef,
          path.text,
          path.points[0][0],
          path.points[0][1],
          path.width,
          path.templateType
        );

        // Draw bounding box for selected text
        if (index === selectedPathIndex) {
          const textWidth = context.measureText(path.text).width;
          const textHeight = path.width; // Height of the text
          const baselineOffset = path.width * 0.8; // Adjust for baseline

          context.strokeStyle = "blue"; // Border color
          context.lineWidth = 2; // Border width
          context.strokeRect(
            path.points[0][0],
            path.points[0][1] - baselineOffset, // Adjust for baseline
            textWidth,
            textHeight
          );
        }
      }
    };

    const drawSolid = () => {
      if (path.type === "draw") {
        const stroke = getStroke(path.points, {
          size: path.width,
          thinning: 0.0,
          smoothing: 0.0,
          streamline: 1.0,
        });
        const pathData = getSvgPathFromStroke(stroke);
        const path2D = new Path2D(pathData);
        context.fillStyle = path.lineColor;
        context.fill(path2D);
      }
    };

    // handle drawing logic based on template type
    if (templateType === "text") {
      drawText();
    } else if (templateType === "solid") {
      drawSolid();
    } else {
      drawText();
      if (path.type !== "text") {
        drawSolid();
      }
    }
  });
};

const writeText = (canvasRef, text, x, y, pathSize, templateType) => {
  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  context.font = pathSize + "px stencil";

  if (templateType === "text") {
    context.textAlign = "center";
  }
  context.fillText(text, x, y);
};

export const drawLine = (canvasRef, startX, startY, endX, endY, width = 7) => {
  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  // Draw the line as a white rectangle
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.lineWidth = width;
  context.strokeStyle = "white";
  context.stroke();
};
