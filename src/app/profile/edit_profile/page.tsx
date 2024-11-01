// EditProfilePage Component
const EditProfilePage = ({ onSave, onBack }) => {
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
  
    const handleSave = () => {
      console.log('Saving profile:', { name, age, profilePicture, daterArchetype, school });
      onSave();
    };
  
    return (
      <div style={commonStyles.container}>
        <h2 style={{
          ...commonStyles.h2,
          color: '#cc0000',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          Edit Your Profile
        </h2>
        <input
          style={commonStyles.input}
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={commonStyles.input}
          type="number"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <select
          style={commonStyles.input}
          value={daterArchetype}
          onChange={(e) => setDaterArchetype(e.target.value)}
        >
          <option value="">Select Dater Archetype</option>
          <option value="hopelessRomantic">Hopeless Romantic</option>
          <option value="cautiousDater">Cautious Dater</option>
          <option value="adventurous">Commitment Seeker</option>
          <option value="traditional">Serial Dater</option>
          <option value="independent">Friends with Benefits</option>
        </select>
        <select
          style={commonStyles.input}
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        >
          <option value="">Select School</option>
          {schools.map((schoolOption) => (
            <option key={schoolOption} value={schoolOption}>
              {schoolOption}
            </option>
          ))}
        </select>
        <input
          style={commonStyles.input}
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePicture(e.target.files[0])}
        />
        <button style={commonStyles.button} onClick={handleSave}>Save Profile</button>
        <button 
          style={{
            ...commonStyles.button, 
            backgroundColor: 'white',
            color: '#cc0000',
            border: '2px solid #cc0000',
            marginTop: '10px'
          }} 
          onClick={onBack}
        >
          Back to Dashboard
        </button>
      </div>
    );
  };