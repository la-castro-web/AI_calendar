import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import CalendarView from '../components/CalendarView';

const Home = () => {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleEventUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="home">
      <h1>Calendário Inteligente - Barbearia</h1>
      <div className="main-content">
        <ChatInterface onEventUpdate={handleEventUpdate} />
        <CalendarView updateTrigger={updateTrigger} />
      </div>
    </div>
  );
};

export default Home; 