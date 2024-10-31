export default function Dashboard(){


    return (
    <div className="">
      <h1 className="">Ophelia</h1>
      <h2 className=""
        // ...commonStyles.h2,
        // color: '#cc0000',
        // fontSize: '16px',
        // fontWeight: '500',
        // textAlign: 'center',
        // marginBottom: '20px',
        // marginTop: '10px'
      >It All Starts with the First Date...</h2>
      <button className="" >Start Dating</button>
      <button className="" >Date Requests</button>
      <button className="" >Upcoming Dates</button>
      <button className="">Edit Profile</button>
      <button 
        // className={{
        //   ...commonStyles.button, 
        //   marginTop: '10px', 
        //   backgroundColor: 'white',
        //   color: '#cc0000',
        //   border: '2px solid #cc0000'
        // }} 
      >
        Logout
      </button>
    </div>
    )
}; 