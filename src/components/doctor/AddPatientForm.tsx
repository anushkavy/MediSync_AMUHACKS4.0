import { useState } from "react";
import "./AddPatientForm.css";

interface Patient {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  lastVisit: string | null;
  notes: string[];
}

interface AddPatientFormProps {
  onAdd: (patient: Patient) => void;
  onCancel: () => void;
  generatePatientCode: () => string;
}

const AddPatientForm = ({
  onAdd,
  onCancel,
  generatePatientCode,
}: AddPatientFormProps) => {
  const [patientData, setPatientData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [generatedCode, setGeneratedCode] = useState(generatePatientCode());
  const [codeRevealed, setCodeRevealed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientData({
      ...patientData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPatient: Patient = {
      id: Date.now().toString(),
      name: patientData.name,
      code: generatedCode,
      email: patientData.email,
      phone: patientData.phone,
      lastVisit: null,
      notes: [],
    };

    onAdd(newPatient);
  };

  const handleGenerateNewCode = () => {
    setGeneratedCode(generatePatientCode());
  };

  return (
    <div className="add-patient-form-container">
      <h3>Add New Patient</h3>

      <form onSubmit={handleSubmit} className="add-patient-form">
        <div className="form-group">
          <label htmlFor="patientName">Patient Name</label>
          <input
            type="text"
            id="patientName"
            name="name"
            value={patientData.name}
            onChange={handleChange}
            required
            placeholder="Enter patient's full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="patientEmail">Email Address</label>
          <input
            type="email"
            id="patientEmail"
            name="email"
            value={patientData.email}
            onChange={handleChange}
            required
            placeholder="Enter patient's email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="patientPhone">Phone Number</label>
          <input
            type="tel"
            id="patientPhone"
            name="phone"
            value={patientData.phone}
            onChange={handleChange}
            required
            placeholder="Enter patient's phone number"
          />
        </div>

        <div className="form-group">
          <label>Patient Code</label>
          <div className="code-container">
            <div className="patient-code-display">
              {codeRevealed ? generatedCode : "• • • • • • • •"}
            </div>
            <div className="code-actions">
              <button
                type="button"
                className="reveal-code-button"
                onClick={() => setCodeRevealed(!codeRevealed)}
              >
                {codeRevealed ? "Hide" : "Show"} Code
              </button>
              <button
                type="button"
                className="generate-code-button"
                onClick={handleGenerateNewCode}
              >
                Generate New
              </button>
              <button
                className="copy-code-button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert(`Patient code ${generatedCode} copied to clipboard!`);
                }}
              >
                Copy Code
              </button>
            </div>
          </div>
          <p className="code-info">
            <svg
              width="16"
              height="16"
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
            This code will be needed for the patient to access their portal
          </p>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-button">
            Add Patient
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;
