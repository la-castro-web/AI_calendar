import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import './CalendarView.css';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    nomeCliente: '',
    servico: '',
    dataHora: new Date().toISOString().slice(0, 16)
  });

  // Buscar eventos do backend
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[CalendarView] Buscando eventos do backend...');
      const response = await api.get('/eventos');
      console.log('[CalendarView] Resposta do backend:', response);
      
      if (response.data) {
        console.log('[CalendarView] Eventos recebidos:', response.data);
        setEvents(response.data);
      } else {
        console.error('[CalendarView] Resposta sem dados');
        setEvents([]);
        setError('Resposta do servidor não contém dados');
      }
    } catch (err) {
      console.error('[CalendarView] Erro ao buscar eventos:', err);
      console.error('[CalendarView] Detalhes do erro:', err.response?.data || err.message);
      setError(`Não foi possível carregar os eventos. Erro: ${err.response?.status} - ${err.response?.data?.error || err.message}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar eventos quando o componente montar
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegar para o mês anterior
  const mesAnterior = () => {
    const novaData = new Date(currentDate);
    novaData.setMonth(novaData.getMonth() - 1);
    setCurrentDate(novaData);
  };

  // Navegar para o próximo mês
  const proximoMes = () => {
    const novaData = new Date(currentDate);
    novaData.setMonth(novaData.getMonth() + 1);
    setCurrentDate(novaData);
  };

  // Abrir modal para criar novo evento
  const handleOpenCreateModal = (date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(9, 0, 0);
    
    setNewEvent({
      nomeCliente: '',
      servico: '',
      dataHora: selectedDate.toISOString().slice(0, 16)
    });
    
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar evento
  const handleOpenEditModal = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      nomeCliente: event.nomeCliente,
      servico: event.servico || '',
      dataHora: new Date(event.dataHora).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Atualizar campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Salvar evento (criar ou atualizar)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedEvent) {
        // Atualizar evento existente
        await api.put(`/eventos/${selectedEvent.id}`, newEvent);
      } else {
        // Criar novo evento
        await api.post('/eventos', newEvent);
      }
      
      // Recarregar eventos
      await fetchEvents();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      setError('Erro ao salvar o evento. Tente novamente.');
    }
  };

  // Excluir evento
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await api.delete(`/eventos/${selectedEvent.id}`);
      await fetchEvents();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      setError('Erro ao excluir o evento. Tente novamente.');
    }
  };

  // Renderizar dias do mês
  const renderDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.map(day => {
      const formattedDate = format(day, 'd');
      const dayEvents = events.filter(event => 
        isSameDay(new Date(event.dataHora), day)
      );
      
      return (
        <div 
          key={day.toString()} 
          className="day-cell"
          onClick={() => handleOpenCreateModal(day)}
        >
          <div className="day-number">{formattedDate}</div>
          {dayEvents.length > 0 && (
            <div className="events-container">
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className="event-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(event);
                  }}
                >
                  {event.nomeCliente} - {event.servico}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={mesAnterior}>&lt;</button>
        <h2>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
        <button onClick={proximoMes}>&gt;</button>
      </div>
      
      <div className="weekdays">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>
      
      <div className="days-grid">
        {renderDays()}
      </div>
      
      {loading && <div className="loading">Carregando eventos...</div>}
      {error && <div className="error">{error}</div>}
      
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedEvent ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label>Nome do Cliente:</label>
                <input 
                  type="text" 
                  name="nomeCliente" 
                  value={newEvent.nomeCliente} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Serviço:</label>
                <input 
                  type="text" 
                  name="servico" 
                  value={newEvent.servico} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Data e Hora:</label>
                <input 
                  type="datetime-local" 
                  name="dataHora" 
                  value={newEvent.dataHora} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>Cancelar</button>
                {selectedEvent && (
                  <button 
                    type="button" 
                    className="delete-button"
                    onClick={handleDeleteEvent}
                  >
                    Excluir
                  </button>
                )}
                <button type="submit" className="save-button">
                  {selectedEvent ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;