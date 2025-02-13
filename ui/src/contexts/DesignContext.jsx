import { createContext, useContext, useState } from "react";

const DesignContext = createContext();

export const FileProvider = ({ children }) => {
  const [imageUrl, setImageUrl] = useState(
    sessionStorage.getItem("imageUrl") || ""
  );

  const [stlUrl, setStlUrl] = useState(
    sessionStorage.getItem("stlUrl") || "default.stl"
  );

  const [stlKey, setStlKey] = useState(sessionStorage.getItem("stlKey") || 0);

  const [templateType, setTemplateType] = useState(
    sessionStorage.getItem("templateType") || "solid"
  );

  const [editorMode, setEditorMode] = useState(
    sessionStorage.getItem("editorMode") || "draw"
  );

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

  const updateTemplateType = (type) => {
    setTemplateType(type);
  };

  const updateEditorMode = (mode) => {
    setEditorMode(mode);
  };

  return (
    <DesignContext.Provider
      value={{
        imageUrl,
        updateImageUrl,
        stlUrl,
        updateStl,
        stlKey,
        updateStlKey,
        templateType,
        updateTemplateType,
        editorMode,
        updateEditorMode,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
};

export const useSession = () => {
  return useContext(DesignContext);
};
