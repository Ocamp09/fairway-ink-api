import { createContext, useContext, useState } from "react";

const DesignContext = createContext();

export const FileProvider = ({ children }) => {
  const [stage, setStage] = useState(
    sessionStorage.getItem("stage") || "design"
  );

  const [scaleStage, setScaleStage] = useState(
    sessionStorage.getItem("scaleStage") || "scale"
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

  const [prevSvgData, setPrevSvgData] = useState(
    sessionStorage.getItem("prevSvg") || ""
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

  const updateScaleStage = (scaleStage) => {
    sessionStorage.setItem("scaleStage", scaleStage);
    setScaleStage(scaleStage);
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

  const updatePrevSvgData = (prev) => {
    sessionStorage.setItem("prevScg", prev);
    setPrevSvgData(prev);
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
    sessionStorage.setItem("templateType", type);
    setTemplateType(type);
  };

  const updateEditorMode = (mode) => {
    sessionStorage.setItem("editorMode", mode);
    setEditorMode(mode);
  };

  return (
    <DesignContext.Provider
      value={{
        stage,
        updateStage,
        scaleStage,
        updateScaleStage,
        imageUrl,
        updateImageUrl,
        imageType,
        updateImageType,
        uploadedPaths,
        updateUploadedPaths,
        svgData,
        updateSvgData,
        prevSvgData,
        updatePrevSvgData,
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
