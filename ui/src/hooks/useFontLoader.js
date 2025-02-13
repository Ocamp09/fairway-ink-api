import { useEffect } from "react";

export const useFontLoader = () => {
  useEffect(() => {
    const myFont = new FontFace("stencil", "url(/gunplay.otf)");

    myFont
      .load()
      .then(() => {
        document.fonts.add(myFont);
      })
      .catch((error) => {
        console.error("Error loading font:", error);
      });
  }, []);
};
