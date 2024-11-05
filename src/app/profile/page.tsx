'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';


// { onSave = () => {}, onBack = () => {} 
const EditProfilePage = () => {
    const router = useRouter(); 
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [daterArchetype, setDaterArchetype] = useState('');
  const [school, setSchool] = useState('');

  const schools = [
    "Boston College",
    "Harvard",
    "MIT",
    "Northeastern",
    "BU",
    "N/A"
  ];

  const daterArchetypes = [
    { value: "hopelessRomantic", label: "Hopeless Romantic" },
    { value: "cautiousDater", label: "Cautious Dater" },
    { value: "adventurous", label: "Commitment Seeker" },
    { value: "traditional", label: "Serial Dater" },
    { value: "independent", label: "Friends with Benefits" }
  ];

  const handleSave = () => {
    // Basic validation
    if (!name || !age || !daterArchetype || !school) {
      alert('Please fill in all required fields');
      return;
    }

    // Age validation
    const ageNum = parseInt(age);
    if (ageNum < 18 || ageNum > 100) {
      alert('Please enter a valid age between 18 and 100');
      return;
    }

    const profileData = {
      name,
      age: ageNum,
      profilePicture,
      daterArchetype,
      school
    };

    console.log('Saving profile:', profileData);
    onSave(profileData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setProfilePicture(file);
      } else {
        alert('Please upload an image file');
        e.target.value = null;
      }
    }
  };

  return (
    <div className="container">
      <h2 className="title">Edit Your Profile</h2>
      
      <div className="form-group">
        <input
          className="input-field"
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <input
          className="input-field"
          type="number"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="18"
          max="100"
          required
        />
      </div>

      <div className="form-group">
        <select
          className="select-field"
          value={daterArchetype}
          onChange={(e) => setDaterArchetype(e.target.value)}
          required
        >
          <option value="">Select Dater Archetype</option>
          {daterArchetypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <select
          className="select-field"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
        >
          <option value="">Select School</option>
          {schools.map((schoolOption) => (
            <option key={schoolOption} value={schoolOption}>
              {schoolOption}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="button-group">
        <button 
          className="save-button"
          onClick={handleSave}
        >
          Save Profile
        </button>
        
        <button
          className="back-button"
          onClick={()=>{router.push('/dashboard')}}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;