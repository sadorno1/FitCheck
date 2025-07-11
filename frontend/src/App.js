import logo from './logo.svg';
import './App.css';

import React from 'react';
import ClosetView from './components/ClosetView';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>My FitCheck Closet</h1>
      <ClosetView />
    </div>
  );
}

export default App;
