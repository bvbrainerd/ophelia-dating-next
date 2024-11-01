'use client';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className=''>
      <h1 className=''>Ophelia</h1>
      <h2
        className=''
        // ...commonStyles.h2,
        // color: '#cc0000',
        // fontSize: '16px',
        // fontWeight: '500',
        // textAlign: 'center',
        // marginBottom: '20px',
        // marginTop: '10px'
      >
        It All Starts with the First Date...
      </h2>
      <button className='' onClick={() => router.push('/dashboard/feed')}>
        Start Dating
      </button>
      <button className='' onClick={() => router.push('/dashboard/requests')}>
        Date Requests
      </button>
      <button className='' onClick={() => router.push('/dashboard/upcoming')}>
        Upcoming Dates
      </button>
      <button className='' onClick={() => router.push('/profile')}>
        Edit Profile
      </button>
      <button
        // className={{
        //   ...commonStyles.button,
        //   marginTop: '10px',
        //   backgroundColor: 'white',
        //   color: '#cc0000',
        //   border: '2px solid #cc0000'
        // }}
        onClick={() => {
          router.push('/');
        }}
      >
        Logout
      </button>
    </div>
  );
}
