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
              width: small ? `30px` : `50px`,
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
              width: small ? `86px` : `150px`,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ModeExamples;
