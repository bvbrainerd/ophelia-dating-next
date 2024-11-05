// components/commonStyles.js

export const commonStyles = {
  // Main container style used across pages
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Prompt', sans-serif",
  },

  // Form input fields
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontFamily: "'Prompt', sans-serif",
  },

  // Primary button style
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

  // Secondary button style (outlined)
  secondaryButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'white',
    color: '#cc0000',
    border: '2px solid #cc0000',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'Prompt', sans-serif",
    fontWeight: '500',
    marginTop: '10px',
  },

  // Main heading (h1)
  h1: {
    textAlign: 'center',
    color: '#cc0000',
    fontWeight: '700',
    fontFamily: "'Prompt', sans-serif",
  },

  // Subheading (h2)
  h2: {
    color: '#333',
    fontWeight: '500',
    fontFamily: "'Prompt', sans-serif",
  },

  // Colored subheading variation
  h2Colored: {
    color: '#cc0000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px',
    fontFamily: "'Prompt', sans-serif",
  },

  // Card container style
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },

  // Profile image style
  profileImage: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '50%',
    marginRight: '15px',
  },

  // Flex container for layout
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },

  // Text styles
  text: {
    margin: '5px 0',
    fontFamily: "'Prompt', sans-serif",
  },

  // Centered text
  centeredText: {
    textAlign: 'center',
    marginBottom: '20px',
    fontFamily: "'Prompt', sans-serif",
  },

  // Success text
  successText: {
    color: '#00cc00',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Error text
  errorText: {
    color: '#cc0000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}

// Helper function to combine styles
export const combineStyles = (...styles) => {
  return Object.assign({}, ...styles);
}

// Example usage in a component:
/*
import { commonStyles, combineStyles } from './commonStyles';

const MyComponent = () => {
  return (
    <div style={commonStyles.container}>
      <h1 style={commonStyles.h1}>Title</h1>
      <input style={commonStyles.input} type="text" />
      <button style={commonStyles.button}>Primary Action</button>
      <button style={commonStyles.secondaryButton}>Secondary Action</button>
      
      // Combining styles example:
      <div style={combineStyles(
        commonStyles.card,
        commonStyles.flexContainer,
        { backgroundColor: '#f5f5f5' }  // Additional custom style
      )}>
        Content
      </div>
    </div>
  );
}
*/