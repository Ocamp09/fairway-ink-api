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
