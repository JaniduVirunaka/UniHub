import React from 'react';
import Login from './Login';

export default function Page() {
  const handleLogin = (userData) => {
    console.log('logged in user', userData);
    // redirect or update app state here
  };

  return (
    <div>
      <Login onLogin={handleLogin} />
    </div>
  );
}
