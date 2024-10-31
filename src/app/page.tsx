'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  // const testingFunction = async () => {
  //   const { error } = await supabase.from('testing').insert({ id: 1 });
  // };
  
  // useEffect(() => {
  //   testingFunction();
  // }, []);


  const onLogin = () => {
    router.push('/dashboard');

    return;
  };

  const onSignup = () => {
    return;
  };

  return (
    <div className='max-w-md mx-auto p-5 font-sans'>
      <h1 className=''>Ophelia</h1>
      <input className='' type='email' placeholder='BC Email' />
      <input className='' type='password' placeholder='Password' />
      <button className='' onClick={onLogin}>
        Log In
      </button>
      <button
        // className={{
        //   // ...styles.button,
        //   backgroundColor: 'white',
        //   color: '#cc0000',
        //   border: '2px solid #cc0000',
        //   marginTop: '10px',
        // }}
        onClick={onSignup}
      >
        Sign Up with BC Email
      </button>
    </div>
  );
}
