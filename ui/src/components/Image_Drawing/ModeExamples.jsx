import "./ModeExamples.css";

const ModeExamples = () => {
  return (
    <>
      <div className="mode-item">
        <p>Solid mode:</p>
        <div className="ball-display">
          <img
            src="/solid.svg"
            alt="Uploaded"
            className="upload-img"
            style={{
              width: `50px`,
            }}
          />
        </div>
      </div>
      <div className="mode-item">
        <p className="mode-desc">Text mode:</p>
        <div className="ball-display">
          <img
            src="/text.svg"
            alt="Uploaded"
            className="upload-img"
            style={{
              width: `150px`,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ModeExamples;
