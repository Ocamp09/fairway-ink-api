import "./Header.css";
// import { LuSun } from "react-icons/lu";
import { IoIosCart } from "react-icons/io";
import { useCart } from "../contexts/CartContext";

const Header = ({ cartPopup, setCartPopup }) => {
  const { getItemCount } = useCart();

  return (
    <>
      <div className="header">
        <div className="header-items">
          <div className="header-start">
            <span>
              <img
                src="/logo_full.png"
                height={40}
                className="d-inline-block align-top"
                alt="React Bootstrap logo"
              />
            </span>
          </div>
          <div className="header-nav">
            {/* <button className="nav-item">Start Designing</button>
            <button className="nav-item">Browse Designs</button> */}
          </div>
          <div className="header-icons">
            {/* <button className="icon-button">Login</button> */}
            <div>
              <button
                className="icon-button"
                onClick={() => {
                  setCartPopup(!cartPopup);
                }}
                title="View cart"
              >
                <IoIosCart size={28} /> ({getItemCount()})
              </button>
            </div>
            {/* <LuSun size={32} color="yellow" fill="#242424" /> */}
          </div>
        </div>
        <hr />
      </div>
    </>
  );
};

export default Header;
