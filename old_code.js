import React, { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

// Common styles object
const commonStyles = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Prompt', sans-serif",
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontFamily: "'Prompt', sans-serif",
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#cc0000',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'Prompt', sans-serif",
    fontWeight: '500',
  },
  h1: {
    textAlign: 'center',
    color: '#cc0000',
    fontWeight: '700',
    fontFamily: "'Prompt', sans-serif",
  },
  h2: {
    color: '#333',
    fontWeight: '500',
    fontFamily: "'Prompt', sans-serif",
  },
};

// LoginSignup Component
const LoginSignup = ({ onLogin, onSignup }) => (
  <div style={commonStyles.container}>
    <h1 style={commonStyles.h1}>Ophelia</h1>
    <input style={commonStyles.input} type="email" placeholder="BC Email" />
    <input style={commonStyles.input} type="password" placeholder="Password" />
    <button style={commonStyles.button} onClick={onLogin}>Log In</button>
    <button 
      style={{...commonStyles.button, backgroundColor: 'white', color: '#cc0000', border: '2px solid #cc0000', marginTop: '10px'}} 
      onClick={onSignup}
    >
      Sign Up with BC Email
    </button>
  </div>
);

// ProfileSetup Component
const ProfileSetup = ({ onComplete }) => (
  <div style={commonStyles.container}>
    <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
      Set Up Your Profile
    </h2>
    <input style={commonStyles.input} type="text" placeholder="Full Name" />
    <input style={commonStyles.input} type="number" placeholder="Age" />
    <select style={commonStyles.input}>
      <option value="">Select Gender</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="other">Other</option>
    </select>
    <select style={commonStyles.input}>
      <option value="">Select School</option>
      <option value="Boston College">Boston College</option>
      <option value="Harvard">Harvard</option>
      <option value="MIT">MIT</option>
      <option value="Northeastern">Northeastern</option>
      <option value="BU">BU</option>
      <option value="N/A">N/A</option>
    </select>
    <button style={commonStyles.button} onClick={onComplete}>Continue</button>
  </div>
);

// DatingTypeQuiz Component
const DatingTypeQuiz = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      question: "On a first date, you prefer:",
      options: [
        "A romantic dinner at a restaurant",
        "An exciting activity like going somewhere",
        "A casual coffee meet-up",
        "A fun group activity with friends"
      ]
    },
    {
      question: "Your ideal partner is someone who:",
      options: [
        "Is romantic and golden-retriever like",
        "Is ambitious and driven",
        "Is happy, laid-back, and easy-going",
        "Is intellectual and nerdy"
      ]
    },
    // ... rest of the questions
  ];

  const handleAnswer = (answer) => {
    setAnswers({...answers, [currentQuestion]: answer});
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const datingStyle = determineDatingStyle(answers);
      onComplete(datingStyle);
    }
  };

  const determineDatingStyle = (answers) => {
    const styles = {
      "Cautious Dater": 0,
      "Serial Dater": 0,
      "Commitment Seeker": 0,
      "Hopeless Romantic": 0,
      "Friends with Benefits": 0
    };
    
    // Determine style based on answers
    return Object.keys(styles).reduce((a, b) => styles[a] > styles[b] ? a : b);
  };

  return (
    <div style={commonStyles.container}>
      <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
        What's Your Dating Style?
      </h2>
      <p style={{textAlign: 'center', marginBottom: '20px'}}>
        Question {currentQuestion + 1} of {questions.length}
      </p>
      <h3 style={{...commonStyles.h2, textAlign: 'center', marginBottom: '20px'}}>
        {questions[currentQuestion].question}
      </h3>
      {questions[currentQuestion].options.map((option, index) => (
        <button 
          key={index}
          style={{...commonStyles.button, marginBottom: '10px'}}
          onClick={() => handleAnswer(index)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

// ResultScreen Component
const ResultScreen = ({ datingStyle, onContinue }) => (
  <div style={commonStyles.container}>
    <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
      Your Dating Style
    </h2>
    <p style={{textAlign: 'center', fontSize: '24px', marginBottom: '20px'}}>
      You are a <strong>{datingStyle}</strong>!
    </p>
    <p style={{textAlign: 'center', marginBottom: '30px'}}>
      Let's start dating and find your perfect match!
    </p>
    <button style={commonStyles.button} onClick={onContinue}>
      Continue to Dashboard
    </button>
  </div>
);

// Dashboard Component
// const Dashboard = ({ onMatch, onMessage, onEditProfile, onLogout, onUpcomingDates }) => (
//   <div style={commonStyles.container}>
//     <h1 style={commonStyles.h1}>Ophelia</h1>
//     <h2 style={{
//       ...commonStyles.h2,
//       color: '#cc0000',
//       fontSize: '16px',
//       fontWeight: '500',
//       textAlign: 'center',
//       marginBottom: '20px',
//       marginTop: '10px'
//     }}>It All Starts with the First Date...</h2>
//     <button style={commonStyles.button} onClick={onMatch}>Start Dating</button>
//     <button style={{...commonStyles.button, marginTop: '10px'}} onClick={onMessage}>Date Requests</button>
//     <button style={{...commonStyles.button, marginTop: '10px'}} onClick={onUpcomingDates}>Upcoming Dates</button>
//     <button style={{...commonStyles.button, marginTop: '10px'}} onClick={onEditProfile}>Edit Profile</button>
//     <button 
//       style={{
//         ...commonStyles.button, 
//         marginTop: '10px', 
//         backgroundColor: 'white',
//         color: '#cc0000',
//         border: '2px solid #cc0000'
//       }} 
//       onClick={onLogout}
//     >
//       Logout
//     </button>
//   </div>
// );

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

// PaymentPage Component
const PaymentPage = ({ selectedDate, onConfirm, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically handle payment processing
    try {
      // Simulating a payment process
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div style={commonStyles.container}>
      <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
        Confirm Your Date
      </h2>
      <p style={{textAlign: 'center', marginBottom: '20px'}}>
        You're one step away from your date with {selectedDate.name}!
      </p>
      <form onSubmit={handleSubmit}>
        <input
          style={commonStyles.input}
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          required
        />
        <input
          style={commonStyles.input}
          type="text"
          placeholder="MM/YY"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
        />
        <input
          style={commonStyles.input}
          type="text"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          required
        />
        <button type="submit" style={commonStyles.button}>
          Pay ${selectedDate.price}
        </button>
      </form>
      <button 
        style={{
          ...commonStyles.button, 
          backgroundColor: 'white',
          color: '#cc0000',
          border: '2px solid #cc0000', 
          marginTop: '10px'
        }}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
};

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

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [userDatingStyle, setUserDatingStyle] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    link.onload = () => setFontLoaded(true);
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const navigateTo = (page) => setCurrentPage(page);

  const handleQuizComplete = (datingStyle) => {
    setUserDatingStyle(datingStyle);
    navigateTo('result');
  };

  const handleDateAccepted = (date) => {
    setSelectedDate(date);
    navigateTo('payment');
  };

  const handlePaymentConfirmed = () => {
    alert('Payment successful! Your date has been confirmed.');
    setSelectedDate(null);
    navigateTo('dashboard');
  };

  if (!fontLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }}>
      {currentPage === 'login' && (
        <LoginSignup 
          onLogin={() => navigateTo('dashboard')} 
          onSignup={() => navigateTo('profile')} 
        />
      )}
      
      {currentPage === 'profile' && (
        <ProfileSetup 
          onComplete={() => navigateTo('quiz')} 
        />
      )}
      
      {currentPage === 'quiz' && (
        <DatingTypeQuiz 
          onComplete={handleQuizComplete} 
        />
      )}
      
      {currentPage === 'result' && (
        <ResultScreen 
          datingStyle={userDatingStyle} 
          onContinue={() => navigateTo('dashboard')} 
        />
      )}
      
      {currentPage === 'dashboard' && (
        <Dashboard 
          onMatch={() => navigateTo('matching')}
          onMessage={() => navigateTo('dateRequests')}
          onEditProfile={() => navigateTo('editProfile')}
          onUpcomingDates={() => navigateTo('upcomingDates')}
          onLogout={() => navigateTo('login')}
        />
      )}
      
      {currentPage === 'matching' && (
        <MatchingPage 
          onBack={() => navigateTo('dashboard')} 
        />
      )}
      
      {currentPage === 'dateRequests' && (
        <MessagingPage 
          onBack={() => navigateTo('dashboard')} 
          onDateAccepted={handleDateAccepted}
        />
      )}
      
      {currentPage === 'payment' && selectedDate && (
        <PaymentPage 
          selectedDate={selectedDate}
          onConfirm={handlePaymentConfirmed}
          onCancel={() => {
            setSelectedDate(null);
            navigateTo('dateRequests');
          }}
        />
      )}
      
      {currentPage === 'editProfile' && (
        <EditProfilePage 
          onSave={() => navigateTo('dashboard')}
          onBack={() => navigateTo('dashboard')}
        />
      )}

      {currentPage === 'upcomingDates' && (
        <UpcomingDatesPage 
          onBack={() => navigateTo('dashboard')}
        />
      )}
    </div>
  );
};

export default App;