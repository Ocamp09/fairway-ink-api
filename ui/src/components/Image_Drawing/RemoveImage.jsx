import { FaImage } from "react-icons/fa6";
import { MdRemoveCircle } from "react-icons/md";
import "./RemoveImage.css";

const RemoveImage = () => {
  return (
    <div className="remove-img">
      <div className="img-back">
        <FaImage size={28} />
      </div>
      <div className="img-front">
        <MdRemoveCircle fill="red" size={16} />
      </div>
    </div>
  );
};

export default RemoveImage;
