import "./InfoPane.css";

const InfoPane = ({ warnText, redText }) => {
  return (
    <div className="info-main" hidden={!warnText && !redText}>
      {warnText && (
        <>
          <div className="warning"></div>
          <p>{warnText}</p>
        </>
      )}
      {redText && (
        <>
          <div className="remove"></div>
          <p>{redText}</p>
        </>
      )}
    </div>
  );
};

export default InfoPane;
