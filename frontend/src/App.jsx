import React, { useState } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import CalendarView from './components/CalendarView';

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleCommandProcessed = (result) => {
    // Incrementar o trigger para forçar a atualização do calendário
    setUpdateTrigger(prev => prev + 1);
    
    // Se um evento foi criado, navegar para a data do evento
    if (result && result.dados && result.dados.dataHora) {
      try {
        const eventDate = new Date(result.dados.dataHora);
        setSelectedDate(eventDate);
      } catch (error) {
        console.error('Erro ao processar data do evento:', error);
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Calendário Inteligente</h1>
      </header>
      
      <div className="app-content">
        <div className="chat-container">
          <ChatInterface onCommandProcessed={handleCommandProcessed} />
        </div>
        <div className="calendar-container">
          <CalendarView 
            updateTrigger={updateTrigger} 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    </div>
  );
}

export default App; 