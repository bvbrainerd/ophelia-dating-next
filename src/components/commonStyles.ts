// src/components/commonStyles.ts

export const commonStyles = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px'
  },
  h2: {
    fontSize: '24px',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '25px',
    border: '1px solid #ddd',
    outline: 'none'
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#cc0000',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 500,
    marginTop: '10px'
  },
  outlineButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'white',
    color: '#cc0000',
    border: '2px solid #cc0000',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 500,
    marginTop: '10px'
  }
} as const