import { createContext, useContext, useState } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [imageUrl, setImageUrl] = useState(
    sessionStorage.getItem("imageUrl") || ""
  );

  const [stlUrl, setStlUrl] = useState(
    sessionStorage.getItem("stlUrl") || "default.stl"
  );

  const updateUrl = (newUrl) => {
    sessionStorage.setItem("imageUrl", newUrl);
    setImageUrl(newUrl);
  };

  const updateStl = (stlUrl) => {
    sessionStorage.setItem("stlUrl", stlUrl);
    setStlUrl(stlUrl);
  };

  return (
    <FileContext.Provider value={{ imageUrl, stlUrl, updateUrl, updateStl }}>
      {children}
    </FileContext.Provider>
  );
};

export const useSession = () => {
  return useContext(FileContext);
};
