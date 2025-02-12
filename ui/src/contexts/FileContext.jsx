import { createContext, useContext, useState } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [imageUrl, setImageUrl] = useState(
    sessionStorage.getItem("imageUrl") || ""
  );

  const [stlUrl, setStlUrl] = useState(
    sessionStorage.getItem("stlUrl") || "default.stl"
  );

  const [stlKey, setStlKey] = useState(sessionStorage.getItem("stlKey") || 0);

  const updateImageUrl = (newUrl) => {
    sessionStorage.setItem("imageUrl", newUrl);
    setImageUrl(newUrl);
  };

  const updateStl = (stlUrl) => {
    sessionStorage.setItem("stlUrl", stlUrl);
    setStlUrl(stlUrl);
  };

  const updateStlKey = () => {
    sessionStorage.setItem("stlKey", Number(stlKey) + 1);
    setStlKey(Number(stlKey) + 1);
  };

  return (
    <FileContext.Provider
      value={{
        imageUrl,
        stlUrl,
        stlKey,
        updateImageUrl,
        updateStl,
        updateStlKey,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useSession = () => {
  return useContext(FileContext);
};
