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
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db, doctorsCollection, notesCollection } from "../../Firebase";
import summarize_notes from "./generateAISummary";

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

  // summary type
  type Summary = {
    id: string;
    patientId: string;
    patientName: string;
    title: string;
    generatedAt: string;
    period: string;
    notesCount: number;
    insights: string;
    recommendations: string;
    notSpecified: string;
  };

  // State variables needed for the summaries feature
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [dateFilter, setDateFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");

  // Function to generate summaries from patient notes
  async function generateSummaries() {
    setIsGeneratingSummaries(true);
    setSummaryProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSummaryProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // const patientNotesTest = [
    //   {
    //     id: "udnfne23",
    //     patientCode: "IM3V5ZED",
    //     patientName: "Chris Almeida",
    //     content:
    //       "I have been having bumos at night and in the morning on my neck, knees, and forearm for the past days",
    //     createdAt: "4-14-2025",
    //   },
    //   {
    //     id: "udnfne23",
    //     patientCode: "XOFJCVCN",
    //     patientName: "KL Bajaj",
    //     content:
    //       "I have been having bumos at night and in the morning on my neck, knees, and forearm for the past days",
    //     createdAt: "4-14-2025",
    //   },
    // ];

    // Filter notes based on selected filters
    let filteredNotes: Note[] = [...patientNotes];

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (dateFilter) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }

      filteredNotes = filteredNotes.filter(
        (note) => new Date(note.createdAt) >= cutoffDate
      );
    }

    // Apply patient filter
    if (patientFilter !== "all") {
      filteredNotes = filteredNotes.filter(
        (note: Note) =>
          note.patientCode === patientFilter ||
          note.patientName === patientFilter
      );
    }

    // Group notes by patient
    const notesByPatient: { [key: string]: Note[] } = {};
    filteredNotes.forEach((note: Note) => {
      if (!notesByPatient[note.patientCode]) {
        notesByPatient[note.patientCode] = [];
      }
      notesByPatient[note.patientCode].push(note);
    });

    // Generate summaries for each patient
    const generatedSummaries: Summary[] = [];
    Object.entries(notesByPatient).forEach(async ([patientId, notes]) => {
      const patient = patients.find((p) => p.id === patientId) || {
        name: "Unknown Patient",
      };

      const summaryAIString = await summarize_notes(
        patientNotes.map((patient) => patient.content)
      );

      const summaryAI = JSON.parse(summaryAIString);
      if (summaryAI) {
        setSummaryProgress(100);
        setIsGeneratingSummaries(false);
        setSummaries(generatedSummaries);
      }
      console.log("sumamary ai", summaryAI);
      // This is where you would implement actual summarization logic
      // For now, we'll create a mock summary
      const summary = {
        id: `summary-${Date.now()}-${patientId}`,
        patientId: patientId,
        patientName: patient.name,
        title: `Health Summary for ${patient.name}`,
        generatedAt: new Date().toISOString(),
        period:
          dateFilter === "all"
            ? "All Time"
            : dateFilter === "week"
            ? "Past Week"
            : dateFilter === "month"
            ? "Past Month"
            : "Past 3 Months",
        notesCount: notes.length,
        insights: summaryAI[0],
        recommendations: summaryAI[1],
        notSpecified: summaryAI[2],
      };

      generatedSummaries.push(summary);
    });
  }

  // Format date function
  const formatSummaryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

          {activeTab === "summaries" && (
            <div className="summaries-container">
              <div className="dashboard-content-header">
                <h2>Patient Insights Summary</h2>
                <button
                  className="summarize-button"
                  onClick={generateSummaries}
                  disabled={isGeneratingSummaries}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 13H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9H9H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isGeneratingSummaries
                    ? "Generating..."
                    : "Generate Summaries"}
                </button>
              </div>

              <div className="summaries-filters">
                <div className="filter-group">
                  <label>Date Range:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="3months">Past 3 Months</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Patient:</label>
                  <select
                    value={patientFilter}
                    onChange={(e) => setPatientFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isGeneratingSummaries ? (
                <div className="summaries-loading">
                  <div className="loading-spinner"></div>
                  <p>Analyzing patient notes and generating insights...</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${summaryProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : summaries.length === 0 ? (
                <div className="no-summaries">
                  <div className="no-summaries-icon">
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
                  <p>No summaries generated yet</p>
                  <p className="helper-text">
                    Click the "Generate Summaries" button to create insights
                    from patient notes
                  </p>
                </div>
              ) : (
                <>
                  <div className="summaries-stats">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{patients.length}</span>
                        <span className="stat-label">Total Patients</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 2V8H20"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 13H8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 17H8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 9H9H8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">
                          {patientNotes.length}
                        </span>
                        <span className="stat-label">Total Notes</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <svg
                          width="24"
                          height="24"
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
                            d="M12 16V12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 8H12.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{summaries.length}</span>
                        <span className="stat-label">Generated Insights</span>
                      </div>
                    </div>
                  </div>

                  {console.log("summaries", summaries)}
                  <div className="summaries-list">
                    {summaries.map((summary) => (
                      <div key={summary.id} className="summary-card">
                        <div className="summary-header">
                          <h3>{summary.title}</h3>
                          <span className="summary-date">
                            {formatSummaryDate(summary.generatedAt)}
                          </span>
                        </div>

                        <div className="summary-meta">
                          <span className="meta-item">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Patient: {summary.patientName}
                          </span>
                          <span className="meta-item">
                            <svg
                              width="16"
                              height="16"
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
                            Period: {summary.period}
                          </span>
                          <span className="meta-item">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 2V8H20"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Notes: {summary.notesCount}
                          </span>
                        </div>

                        <div className="summary-content">
                          <h4>Key Insights:</h4>
                          <ul className="insights-list">
                            <li>{summary.insights}</li>
                          </ul>

                          {summary.recommendations && (
                            <>
                              <h4>Recommendations:</h4>
                              <ul className="recommendations-list">
                                <li>{summary.recommendations}</li>
                              </ul>
                            </>
                          )}

                          {summary.notSpecified && (
                            <>
                              <h4>
                                More details to gather to make diagnosis better:
                              </h4>
                              <ul className="recommendations-list">
                                <li>{summary.notSpecified}</li>
                              </ul>
                            </>
                          )}
                        </div>

                        <div className="summary-actions">
                          <button className="action-button print-button">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 9V2H18V9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18 14H6V22H18V14Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Print
                          </button>
                          <button className="action-button export-button">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M7 10L12 15L17 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 15V3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Export
                          </button>
                          <button className="action-button share-button">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8.59 13.51L15.42 17.49"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.41 6.51L8.59 10.49"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
