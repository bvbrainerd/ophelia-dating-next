// UpcomingDatesPage Component
const UpcomingDatesPage = ({ onBack }) => {
    const [upcomingDates] = useState([
      {
        id: 1,
        name: 'Adelaide',
        age: 19,
        image: '/images/adelaide_profile.jpg',
        venue: 'Fenway Park',
        date: '2024-11-02',
        time: '20:00',
        status: 'confirmed',
        price: 50,
        description: 'Hopeless Romantic'
      },
      {
        id: 2,
        name: 'Emelia',
        age: 21,
        image: '/images/emelia_profile.jpg',
        venue: 'Kured',
        date: '2024-11-01',
        time: '13:00',
        status: 'confirmed',
        price: 30,
        description: 'Cautious Dater'
      }
    ]);
  
    const formatDateTime = (date, time) => {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
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
          Your Upcoming Dates
        </h2>
  
        {upcomingDates.length === 0 ? (
          <p style={{ textAlign: 'center', marginBottom: '20px' }}>
            No upcoming dates scheduled yet.
          </p>
        ) : (
          upcomingDates.map(date => (
            <div key={date.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <img 
                  src={date.image}
                  alt={date.name} 
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    marginRight: '15px'
                  }} 
                />
                <div>
                  <h3 style={{ color: '#cc0000', margin: '0 0 5px 0' }}>
                    {date.name}, {date.age}
                  </h3>
                  <p style={{ margin: '5px 0' }}>{date.description}</p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>When:</strong> {formatDateTime(date.date, date.time)}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Where:</strong> {date.venue}
                  </p>
                </div>
              </div>
              <div style={{
                backgroundColor: '#f8f8f8',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <p style={{ margin: 0, textAlign: 'center', color: '#cc0000' }}>
                  Paid & Confirmed ✓
                </p>
              </div>
            </div>
          ))
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