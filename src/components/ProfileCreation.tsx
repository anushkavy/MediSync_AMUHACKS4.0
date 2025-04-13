import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileCreation.css";

interface ProfileCreationProps {
  userType: string;
  onComplete: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  [key: string]: string | undefined;
}

const ProfileCreation = ({ userType, onComplete }: ProfileCreationProps) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const extraFields =
    userType === "doctor"
      ? { specialization: "", licenseNumber: "" }
      : { dateOfBirth: "", emergencyContact: "" };

  const [formData, setFormData] = useState<ProfileData>({
    ...profileData,
    ...extraFields,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      `${userType.toLowerCase()}Profile`,
      JSON.stringify(formData)
    );
    setProfileData(formData);

    if (userType === "doctor") {
      if (!localStorage.getItem("patients")) {
        localStorage.setItem("patients", JSON.stringify([]));
      }
    }

    onComplete();
    navigate(`/${userType.toLowerCase()}-dashboard`);
  };

  return (
    <div className="profile-creation-container">
      <div className="profile-creation-content">
        <h1>Create Your {userType} Profile</h1>
        <p>Please provide your details to set up your account</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>

          {userType === "doctor" && (
            <>
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization || ""}
                  onChange={handleChange}
                  required
                  placeholder="Enter your medical specialization"
                />
              </div>

              <div className="form-group">
                <label htmlFor="licenseNumber">License Number</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber || ""}
                  onChange={handleChange}
                  required
                  placeholder="Enter your medical license number"
                />
              </div>
            </>
          )}

          {userType === "patient" && (
            <>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={handleChange}
                  required
                  placeholder="Enter emergency contact details"
                />
              </div>
            </>
          )}

          <button type="submit" className="create-profile-button">
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;
