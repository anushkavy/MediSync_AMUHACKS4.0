import { useState, useEffect } from "react";
import "./PatientDashboard.css";
import { getDocs, query, where, orderBy, addDoc } from "firebase/firestore";
import { doctorsCollection, notesCollection } from "../../Firebase";

const PatientDashboard = () => {
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [patientCode, setPatientCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [noteText, setNoteText] = useState("");
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const loadPatientNotes = async (code: string) => {
    try {
      setNotesLoading(true);
      const notesQuery = query(
        notesCollection,
        where("patientCode", "==", code),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(notesQuery);
      const notes: any[] = [];

      snapshot.forEach((doc) => {
        notes.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setPatientNotes(notes);
      setNotesLoading(false);
    } catch (error) {
      console.error("Error loading patient notes:", error);
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    const profileData = localStorage.getItem("patientProfile");
    if (profileData) {
      setPatientProfile(JSON.parse(profileData));
    }

    // Check if patient is already verified
    const storedData = localStorage.getItem("verifiedPatientData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setPatientData(parsedData);
      setIsVerified(true);
      loadPatientNotes("SWEAOBUH");
    }
    setIsLoading(false);
  }, []);

  const saveNote = async () => {
    if (!noteText.trim() || !patientData?.code) return;

    try {
      setSaveLoading(true);

      await addDoc(notesCollection, {
        patientCode: patientData.code,
        content: noteText,
        createdAt: new Date().toISOString(),
        patientName: patientData.name,
      });

      // Reload notes
      await loadPatientNotes(patientData.code);

      // Reset and go back to dashboard
      setNoteText("");
      setActiveView("dashboard");
      setSaveLoading(false);
    } catch (error) {
      console.error("Error saving note:", error);
      setSaveLoading(false);
    }
  };
  async function verifyPatientCode() {
    try {
      const snapshot = await getDocs(doctorsCollection);
      let found = false;

      snapshot.forEach((doc) => {
        const doctorData = doc.data();
        const matchingPatient = doctorData.patients?.find(
          (patient: any) => patient.code === patientCode
        );
        if (matchingPatient) {
          setPatientData(matchingPatient);
          setIsVerified(true);
          localStorage.setItem(
            "verifiedPatientData",
            JSON.stringify(matchingPatient)
          );
          localStorage.setItem("isVerified", "true");
          setCodeError("");
          found = true;
          loadPatientNotes(patientCode);
        }
      });
      if (!found) {
        setCodeError("Invalid patient code. Please check and try again.");
      }
    } catch (error) {
      console.error("Error verifying patient code:", error);
      setCodeError("Something went wrong. Please try again later.");
    }
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Patient Portal</h1>
          {patientProfile && <p>Welcome, {patientProfile.name}</p>}
        </div>
        <div className="header-right">
          <button className="profile-button">
            <span className="profile-initial">
              {patientProfile?.name?.charAt(0) || "P"}
            </span>
          </button>
        </div>
      </div>

      {!isVerified ? (
        <div className="verification-container">
          <div className="verification-card">
            <div className="verification-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 9L9 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Enter Your Patient Code</h2>
            <p>
              Please enter the patient code provided by your doctor to access
              your health information.
            </p>

            <div className="code-input-container">
              <input
                type="text"
                placeholder="Enter your patient code"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                className={codeError ? "error" : ""}
              />
              {codeError && <p className="error-message">{codeError}</p>}
            </div>

            <button className="verify-button" onClick={verifyPatientCode}>
              Verify Code
            </button>
          </div>
        </div>
      ) : (
        <div className="patient-portal-container">
          <div className="dashboard-sidebar">
            <div
              className={`menu-item ${
                activeView === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveView("dashboard")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12H15V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </div>
            <div className="menu-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Appointments
            </div>
            <div
              className={`menu-item ${
                activeView === "health-notes" ? "active" : ""
              }`}
              onClick={() => {
                setActiveView("health-notes");
                loadPatientNotes(patientData.code);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9V13M12 17H12.01M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Health Notes
            </div>
            <div className="menu-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 10H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Medications
            </div>
          </div>

          <div className="dashboard-content">
            {activeView === "dashboard" && (
              <>
                <div className="welcome-card">
                  <h2>Welcome, {patientData.name}!</h2>
                  <p>
                    Your patient code:{" "}
                    <span className="patient-code">{patientData.code}</span>
                  </p>
                  <div className="last-visit">
                    {patientData.lastVisit ? (
                      <p>
                        Last visit:{" "}
                        {new Date(patientData.lastVisit).toLocaleDateString()}
                      </p>
                    ) : (
                      <p>No previous visits recorded</p>
                    )}
                  </div>
                </div>

                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon health-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 8V16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 12H16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3>Add Health Note</h3>
                    <p>Record your daily health status</p>
                    <button
                      className="card-button"
                      onClick={() => setActiveView("add-note")}
                    >
                      Add Note
                    </button>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon med-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3>Medication Schedule</h3>
                    <p>View your medication schedule</p>
                    <button className="card-button">View Schedule</button>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-icon appt-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 8V12L15 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3>Upcoming Appointments</h3>
                    <p>View and manage appointments</p>
                    <button className="card-button">View Appointments</button>
                  </div>
                </div>
              </>
            )}
            {activeView === "add-note" && (
              <div className="note-editor">
                <div className="note-editor-header">
                  <h2>Add Health Note</h2>
                  <p>Record your daily health status and symptoms</p>
                </div>

                <textarea
                  className="note-textarea"
                  placeholder="Enter your health note here... (e.g., symptoms, medication effects, general well-being)"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={10}
                ></textarea>

                <div className="note-actions">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setNoteText("");
                      setActiveView("dashboard");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-button"
                    onClick={saveNote}
                    disabled={saveLoading || !noteText.trim()}
                  >
                    {saveLoading ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            )}
            {activeView === "health-notes" && (
              <div className="health-notes-view">
                <div className="health-notes-header">
                  <h2>Your Health Notes</h2>
                  <button
                    className="add-note-button"
                    onClick={() => setActiveView("add-note")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                    >
                      <path
                        d="M12 5V19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add New Note
                  </button>
                </div>

                {notesLoading ? (
                  <div className="notes-loading">Loading your notes...</div>
                ) : patientNotes.length === 0 ? (
                  <div className="no-notes">
                    <div className="no-notes-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                      >
                        <path
                          d="M9 12H15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 9V15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p>You don't have any health notes yet</p>
                    <button
                      className="create-first-note"
                      onClick={() => setActiveView("add-note")}
                    >
                      Create your first note
                    </button>
                  </div>
                ) : (
                  <div className="notes-list">
                    {patientNotes.map((note) => (
                      <div key={note.id} className="note-card">
                        <div className="note-date">
                          {formatDate(note.createdAt)}
                        </div>
                        <div className="note-content">{note.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
