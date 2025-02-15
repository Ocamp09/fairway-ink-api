import "./ModeExamples.css";

const ModeExamples = ({ small }) => {
  return (
    <>
      <div className={small ? "mode-item-small" : "mode-item"}>
        <p className="mode-desc">Solid mode:</p>
        <div className={small ? "ball-display-small" : "ball-display"}>
          <img
            src="/solid.svg"
            alt="Uploaded"
            className="display-img"
            style={{
              width: small ? `40px` : `40px`,
            }}
          />
        </div>
      </div>
      <div className={small ? "mode-item-small" : "mode-item"}>
        <p className="mode-desc">Text mode:</p>
        <div className={small ? "ball-display-small" : "ball-display"}>
          <img
            src="/text.svg"
            alt="Uploaded"
            className="display-img"
            style={{
              width: small ? `86px` : `100px`,
            }}
          />
        </div>
      </div>
      <div className={small ? "mode-item-small" : "mode-item"}>
        <p className="mode-desc">Custom mode:</p>
        <div className={small ? "ball-display-small" : "ball-display"}>
          <img
            src="/custom.svg"
            alt="Uploaded"
            className="display-img"
            style={{
              width: small ? `75px` : `80px`,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ModeExamples;
