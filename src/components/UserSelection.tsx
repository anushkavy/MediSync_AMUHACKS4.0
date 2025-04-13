import { useState } from "react";
import "./UserSelection.css";

interface UserSelectionProps {
  setUserType: (type: string) => void;
}

const UserSelection = ({ setUserType }: UserSelectionProps) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="user-selection-container">
      <div className="user-selection-content">
        <h1>Welcome to MediSync</h1>
        <p>Please select your role to continue</p>

        <div className="user-selection-options">
          <div
            className={`user-selection-option ${
              hoveredOption === "doctor" ? "hovered" : ""
            }`}
            onClick={() => setUserType("doctor")}
            onMouseEnter={() => setHoveredOption("doctor")}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="option-icon doctor-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3V9H18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 21H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 21V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Doctor</h2>
            <p>Access patient records and get health summary in one click</p>
          </div>

          <div
            className={`user-selection-option ${
              hoveredOption === "patient" ? "hovered" : ""
            }`}
            onClick={() => setUserType("patient")}
            onMouseEnter={() => setHoveredOption("patient")}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="option-icon patient-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Patient</h2>
            <p>
              Track your health, record daily notes, and manage your medication
              schedule
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;
