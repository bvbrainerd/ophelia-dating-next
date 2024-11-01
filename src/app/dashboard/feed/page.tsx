// MatchingPage Component
const MatchingPage = ({ onBack }) => {
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [dateLocation, setDateLocation] = useState('');
    const [dateTime, setDateTime] = useState('');
  
    const matches = [
      { name: 'Claudia', age: 21, image: '/images/claudia_profile.jpg', description: 'Cautious Dater, Ideal Date: Restaurant, Humor: Witty' },
      { name: 'Virginia', age: 20, image: '/images/Virginia_profile.jpg', description: 'Hopeless Romantic, Ideal Date: Concert, Favorite Genre: Alternative' },
    ];
  
    const venues = [
      "Red Sox @Fenway Park",
      "Kured",
      "Museum of Fine Arts",
      "Lolita Back Bay",
      "Celtics Game @TD Garden",
      "Custom"
    ];
  
    const handleDateRequest = () => {
      if (selectedMatch && dateLocation && dateTime) {
        console.log(`Date request sent to ${selectedMatch.name} for ${dateLocation} at ${dateTime}`);
        setSelectedMatch(null);
        setDateLocation('');
        setDateTime('');
      } else {
        alert('Please select a match, location, and time before sending a date request.');
      }
    };
  
    return (
      <div style={commonStyles.container}>
        <h2 style={{
          ...commonStyles.h2,
          color: '#cc0000',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px'
        }}>Your Matches</h2>
        
        {matches.map((match, index) => (
          <div key={index} style={{border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
              <img 
                src={match.image}
                alt={match.name} 
                style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginRight: '15px'}} 
              />
              <div>
                <h3 style={{margin: '0', color: '#cc0000'}}>{match.name}, {match.age}</h3>
                <p style={{margin: '5px 0'}}>{match.description}</p>
              </div>
            </div>
            <button 
              style={{...commonStyles.button, width: 'auto'}}
              onClick={() => setSelectedMatch(match)}
            >
              Date
            </button>
          </div>
        ))}
  
        {selectedMatch && (
          <div style={{marginTop: '20px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px'}}>
            <h3 style={{color: '#cc0000', marginBottom: '10px'}}>Set up your date with {selectedMatch.name}</h3>
            <select
              style={commonStyles.input}
              value={dateLocation}
              onChange={(e) => setDateLocation(e.target.value)}
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
            {dateLocation === 'Custom' && (
              <input
                style={commonStyles.input}
                type="text"
                placeholder="Enter custom venue"
                onChange={(e) => setDateLocation(e.target.value)}
              />
            )}
            <input
              style={commonStyles.input}
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
            <button style={commonStyles.button} onClick={handleDateRequest}>Send Date Request</button>
          </div>
        )}
  
        <button 
          style={{
            ...commonStyles.button, 
            backgroundColor: 'white',
            color: '#cc0000',
            border: '2px solid #cc0000',
            marginTop: '20px'
          }} 
          onClick={onBack}
        >
          Back to Dashboard
        </button>
      </div>
    );
  };