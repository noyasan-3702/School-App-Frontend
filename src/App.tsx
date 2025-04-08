import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AllList from "./AllList";
import "./App.css";
import AttendanceList from "./AttendanceList";
import { Provider } from "./components/ui/provider";
import Dashboard from "./dashboard";
import ExperiencerList from "./ExperiencerList";
import Login from "./Login";
import Menu from "./Menu";
import { PaymentList } from "./PaymentList";
import QRcodeReading from "./QRcodeReading";
import { Reserve } from "./Reserve";
import TakeAttendance from "./TakeAttendance";
import { Thanks } from "./Thanks";
import TrialDateSetting from "./TrialDateSetting";
import TrialForm from "./TrialForm";

function App() {
  // 認証の権限があるかどうかを管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 認証済状態に変更する関数
  const onLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      <Router>
        <Routes>
          {/* 認証が必要ない画面 */}
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/TrialForm" element={<TrialForm />} />
          <Route path="/thanks" element={<Thanks />} />

          {/* 認証が必要な画面 */}
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <div className="menu-area">
                  <Menu />
                  <Routes>
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/TakeAttendance" element={<TakeAttendance />} />
                    <Route path="/ExperiencerList" element={<ExperiencerList />} />
                    <Route path="/AllList" element={<AllList />} />
                    <Route path="/AttendanceList" element={<AttendanceList />} />
                    <Route path="/TrialDateSetting" element={<TrialDateSetting />} />
                    <Route path="/QRcodeReading" element={<QRcodeReading />} />
                    <Route path="/PaymentList" element={<PaymentList />} />
                  </Routes>
                </div>
              ) : (
                <Provider>
                  <Login onLogin={onLogin} />
                </Provider>
              )
            }
          ></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
