import React, { createContext, useContext, useState, useEffect } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [imageUrl, setImageUrl] = useState(
    sessionStorage.getItem("imageUrl") || ""
  );

  const updateUrl = (newUrl) => {
    sessionStorage.setItem("imageUrl", newUrl);
    setImageUrl(newUrl);
  };

  return (
    <FileContext.Provider value={{ imageUrl, updateUrl }}>
      {children}
    </FileContext.Provider>
  );
};

export const useSession = () => {
  return useContext(FileContext);
};
