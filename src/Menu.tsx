import { IconContext } from "react-icons"; //IconContextをインポート
import { AiOutlinePayCircle } from "react-icons/ai";
import { BsQrCode } from "react-icons/bs";
import { FaHouseChimney, FaPersonWalking } from "react-icons/fa6";
import { GoPeople, GoPersonAdd } from "react-icons/go";
import { IoSettings } from "react-icons/io5";
import { Link } from "react-router-dom";
import "./App.css";

function Menu() {
  return (
    <nav>
      <Link to="/Dashboard">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <FaHouseChimney />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>ダッシュボード</h1>
          </label>
        </div>
      </Link>
      <Link to="/TakeAttendance">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <FaPersonWalking />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>出席者リスト</h1>
          </label>
        </div>
      </Link>
      <Link to="/ExperiencerList">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <GoPersonAdd />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>体験者リスト</h1>
          </label>
        </div>
      </Link>
      <Link to="/TrialDateSetting">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <IoSettings />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>体験日設定</h1>
          </label>
        </div>
      </Link>
      <Link to="/AllList">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <GoPeople />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>メンバーリスト</h1>
          </label>
        </div>
      </Link>
      <Link to="/QRcodeReading">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <BsQrCode />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>QR出席</h1>
          </label>
        </div>
      </Link>
      <Link to="/PaymentList">
        <div className="link-box">
          <label className="link-icon">
            <IconContext.Provider value={{ color: "#000", size: "30px" }}>
              <AiOutlinePayCircle />
            </IconContext.Provider>
          </label>
          <label className="link-text">
            <h1>事前決済者リスト</h1>
          </label>
        </div>
      </Link>
    </nav>
  );
}

export default Menu;
