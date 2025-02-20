import "./InfoPane.css";

const InfoPane = ({ warnText, redText }) => {
  return (
    <div className="info-main" hidden={!warnText && !redText}>
      {warnText && (
        <div className={redText ? "info-item hr" : "info-item"}>
          <div className="warning"></div>
          <p>{warnText}</p>
        </div>
      )}
      {redText && (
        <div className="info-item">
          <div className="remove"></div>
          <p>{redText}</p>
        </div>
      )}
    </div>
  );
};

export default InfoPane;
