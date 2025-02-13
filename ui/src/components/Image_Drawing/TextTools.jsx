import QuantityDropdown from "../Preview/QuantityDropdown";
import { MdTextFields } from "react-icons/md";

const TextTools = ({ fontSize, setFontSize, iconSize }) => {
  const lineLabel = <MdTextFields size={iconSize} color="white" />;

  return (
    <>
      <QuantityDropdown
        minQuantity={30}
        maxQuantity={80}
        labelText={lineLabel}
        step={10}
        quantity={fontSize}
        setQuantity={setFontSize}
        title={"Adjust font size"}
      />
    </>
  );
};

export default TextTools;
