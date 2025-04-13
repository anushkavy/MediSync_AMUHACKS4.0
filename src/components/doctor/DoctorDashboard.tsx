import { useState, useEffect } from "react";
import PatientList from "./PatientList";
import AddPatientForm from "./AddPatientForm";
import "./DoctorDashboard.css";
import {
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db, doctorsCollection, notesCollection } from "../../Firebase";

interface Patient {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  lastVisit: string | null;
  notes: string[];
}

interface Note {
  id: string;
  patientCode: string;
  patientName: string;
  content: string;
  createdAt: string;
}

const DoctorDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const doctorId = JSON.parse(localStorage.getItem("doctorId") || "");
  const [activeTab, setActiveTab] = useState("patients");
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doctorsCollection,
      function (snapshot: QuerySnapshot<DocumentData>) {
        const matchedDoc = snapshot.docs.find((doc) => doc.id === doctorId);
        if (matchedDoc) {
          setDoctorProfile({ ...matchedDoc.data(), id: matchedDoc.id });
        }
      }
    );
    return unsubscribe;
  }, [doctorId]);

  useEffect(() => {
    if (doctorProfile) {
      setPatients((doctorProfile as { patients: [] })?.patients);
    }
  }, [doctorProfile]);

  useEffect(() => {
    if (activeTab === "patient-notes" && patients && patients.length > 0) {
      fetchAllPatientNotes();
    }
  }, [activeTab, patients]);

  // Fetch all notes from all patients
  const fetchAllPatientNotes = async () => {
    if (!patients || patients.length === 0) return;

    setIsLoadingNotes(true);
    try {
      const patientCodes = patients.map((patient) => patient.code);
      const notesQuery = query(
        notesCollection,
        where("patientCode", "in", patientCodes),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(notesQuery);
      const notes: Note[] = [];

      snapshot.forEach((doc) => {
        notes.push({
          id: doc.id,
          ...(doc.data() as Omit<Note, "id">),
        });
      });

      setPatientNotes(notes);
    } catch (error) {
      console.error("Error fetching patient notes:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // add new patients
  async function savePatients(updatedPatients: Patient[]) {
    const docRef = doc(db, "doctors", doctorId);
    await setDoc(docRef, { patients: updatedPatients }, { merge: true });
  }

  const addPatient = (newPatient: Patient) => {
    const updatedPatients = [...patients, newPatient];
    savePatients(updatedPatients);
    setShowAddPatient(false);
  };

  const generatePatientCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Doctor Dashboard</h1>
          {doctorProfile && <p>Welcome, Dr. {doctorProfile.name}</p>}
        </div>
        <div className="header-right">
          <button className="profile-button">
            <span className="profile-initial">
              {doctorProfile?.name?.charAt(0) || "D"}
            </span>
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div
            className={`menu-item ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 21C20 16.58 16.42 13 12 13C7.58 13 4 16.58 4 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Patients
          </div>
          <div
            className={`menu-item ${
              activeTab === "patient-notes" ? "active" : ""
            }`}
            onClick={() => setActiveTab("patient-notes")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
            Patient Notes
          </div>
          <div
            className={`menu-item ${
              activeTab === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("appointments")}
          >
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
            className={`menu-item ${activeTab === "summaries" ? "active" : ""}`}
            onClick={() => setActiveTab("summaries")}
          >
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
            Summaries
          </div>
        </div>

        <div className="dashboard-content">
          {activeTab === "patients" && (
            <>
              <div className="dashboard-content-header">
                <h2>Your Patients</h2>
                <button
                  className="add-patient-button"
                  onClick={() => setShowAddPatient(!showAddPatient)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
                  Add Patient
                </button>
              </div>

              {showAddPatient ? (
                <AddPatientForm
                  onAdd={addPatient}
                  onCancel={() => setShowAddPatient(false)}
                  generatePatientCode={generatePatientCode}
                />
              ) : (
                <PatientList patients={patients} />
              )}
            </>
          )}

          {activeTab === "patient-notes" && (
            <div className="patient-notes-container">
              <div className="dashboard-content-header">
                <h2>Patient Health Notes</h2>
                <button
                  className="refresh-notes-button"
                  onClick={fetchAllPatientNotes}
                  disabled={isLoadingNotes}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4V10H7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M23 20V14H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.49 9C19.9828 7.56678 19.1209 6.2689 17.9845 5.23489C16.8482 4.20089 15.4745 3.46426 13.9917 3.10029C12.5089 2.73631 10.9652 2.75627 9.49214 3.15793C8.01903 3.5596 6.66849 4.32812 5.56 5.39L1 10M23 14L18.44 18.61C17.3315 19.6719 15.981 20.4404 14.5079 20.8421C13.0348 21.2437 11.4911 21.2637 10.0083 20.8997C8.52547 20.5357 7.15181 19.7991 6.01547 18.7651C4.87913 17.7311 4.01717 16.4332 3.51 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              {isLoadingNotes ? (
                <div className="notes-loading">Loading patient notes...</div>
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
                  <p>No health notes found for your patients</p>
                </div>
              ) : (
                <div className="notes-list">
                  {patientNotes.map((note) => (
                    <div key={note.id} className="note-card">
                      <div className="note-header">
                        <h3>{note.patientName}</h3>
                        <span className="patient-code">
                          Code: {note.patientCode}
                        </span>
                        <span className="note-date">
                          {formatDate(note.createdAt)}
                        </span>
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
    </div>
  );
};

export default DoctorDashboard;
