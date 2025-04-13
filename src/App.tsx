import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserSelection from "./components/UserSelection";
import ProfileCreation from "./components/ProfileCreation";
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import PatientDashboard from "./components/patient/PatientDashboard";

function App() {
  const [userType, setUserType] = useState<string | null>(
    localStorage.getItem("userType")
  );
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(
    localStorage.getItem("profileComplete") === "true"
  );

  useEffect(() => {
    localStorage.setItem("userType", userType || "");
  }, [userType]);

  useEffect(() => {
    localStorage.setItem(
      "profileComplete",
      isProfileComplete ? "true" : "false"
    );
  }, [isProfileComplete]);

  return (
    <div className="app">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !userType ? (
                <UserSelection setUserType={setUserType} />
              ) : !isProfileComplete ? (
                <ProfileCreation
                  userType={userType}
                  onComplete={() => setIsProfileComplete(true)}
                />
              ) : (
                <Navigate to={`/${userType.toLowerCase()}-dashboard`} />
              )
            }
          />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
