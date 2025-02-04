import "./Header.css";
// import { LuSun } from "react-icons/lu";
import { IoIosCart } from "react-icons/io";

const Header = () => {
  return (
    <>
      <div className="header">
        <div className="header-items">
          <div className="header-start">
            <img
              src="/logo.svg"
              width="80"
              height="70"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
            <span className="home-name">Fairway Ink</span>
          </div>
          <div className="header-nav">
            {/* <button className="nav-item">Start Designing</button>
            <button className="nav-item">Browse Designs</button> */}
          </div>
          <div className="header-icons">
            <button className="icon-button">Login</button>
            <button className="icon-button">
              <IoIosCart size={24} />
            </button>
            {/* <LuSun size={32} color="yellow" fill="#242424" /> */}
          </div>
        </div>
        <hr />
      </div>
    </>
  );
};

export default Header;
