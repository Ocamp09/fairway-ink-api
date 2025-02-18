import { createContext, useContext, useState } from "react";

const DesignContext = createContext();

export const FileProvider = ({ children }) => {
  const [stage, setStage] = useState(
    sessionStorage.getItem("stage") || "design"
  );

  const [imageUrl, setImageUrl] = useState(
    sessionStorage.getItem("imageUrl") || null
  );

  const [imageType, setImageType] = useState(
    sessionStorage.getItem("imageType") || ""
  );

  const [uploadedPaths, setUploadedPaths] = useState(
    JSON.parse(sessionStorage.getItem("uploadedPaths")) || []
  );

  const [svgData, setSvgData] = useState(
    sessionStorage.getItem("svgData") || ""
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

  const updateStage = (stage) => {
    sessionStorage.setItem("stage", stage);
    setStage(stage);
  };

  const updateImageUrl = (newUrl) => {
    sessionStorage.setItem("imageUrl", newUrl);
    setImageUrl(newUrl);
  };

  const updateImageType = (type) => {
    sessionStorage.setItem("imageType", type);
    setImageType(type);
  };

  const updateUploadedPaths = (paths) => {
    sessionStorage.setItem("uploadedPaths", JSON.stringify(paths));
    setUploadedPaths(paths);
  };

  const updateSvgData = (data) => {
    sessionStorage.setItem("svgData", data);
    setSvgData(data);
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
        stage,
        updateStage,
        imageUrl,
        updateImageUrl,
        imageType,
        updateImageType,
        uploadedPaths,
        updateUploadedPaths,
        svgData,
        updateSvgData,
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
