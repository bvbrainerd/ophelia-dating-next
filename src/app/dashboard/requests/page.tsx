// MessagingPage Component
const MessagingPage = ({ onBack, onDateAccepted }) => {
    const [dateRequests, setDateRequests] = useState([
      {
        id: 1,
        name: 'Adelaide',
        age: 19,
        image: '/images/adelaide_profile.jpg',
        description: 'Hopeless Romantic',
        venue: 'Fenway Park',
        date: '11/2',
        time: '8:00 p.m',
        status: 'pending',
        price: 50
      },
      {
        id: 2,
        name: 'Emelia',
        age: 21,
        image: '/images/emelia_profile.jpg',
        description: 'Cautious Dater',
        venue: 'Kured',
        date: '11/1',
        time: '1:00 p.m',
        status: 'pending',
        price: 30
      }
    ]);
  
    const handleDateResponse = (id, response) => {
      setDateRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === id ? { ...request, status: response } : request
        )
      );
      if (response === 'accepted') {
        onDateAccepted(dateRequests.find(request => request.id === id));
      }
    };
  
    return (
      <div style={commonStyles.container}>
        <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
          Your Date Requests
        </h2>
        {dateRequests.map(request => (
          <div key={request.id} style={{border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
              <img 
                src={request.image}
                alt={request.name} 
                style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginRight: '15px'}} 
              />
              <div>
                <h3 style={{ color: '#cc0000', margin: '0 0 5px 0' }}>{request.name}, {request.age}</h3>
                <p style={{margin: '5px 0'}}>{request.description}, {request.venue} {request.date} @{request.time}</p>
                <p style={{margin: '5px 0'}}>Price: ${request.price}</p>
              </div>
            </div>
            {request.status === 'pending' ? (
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                <button 
                  style={{...commonStyles.button, width: '48%'}}
                  onClick={() => handleDateResponse(request.id, 'accepted')}
                >
                  Accept
                </button>
                <button 
                  style={{...commonStyles.button, width: '48%', backgroundColor: 'white', color: '#cc0000', border: '2px solid #cc0000'}}
                  onClick={() => handleDateResponse(request.id, 'declined')}
                >
                  Decline
                </button>
              </div>
            ) : (
              <p style={{
                textAlign: 'center', 
                fontWeight: 'bold', 
                color: request.status === 'accepted' ? '#00cc00' : '#cc0000'
              }}>
                {request.status === 'accepted' ? 'Accepted' : 'Declined'}
              </p>
            )}
          </div>
        ))}
        <button 
          style={{...commonStyles.button, backgroundColor: 'white', color: '#cc0000', border: '2px solid #cc0000', marginTop: '20px'}}
          onClick={onBack}
        >
          Back to Dashboard
        </button>
      </div>
    );
  };