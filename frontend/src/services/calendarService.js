import api from './api';

const calendarService = {
  // Obter todos os eventos
  getEvents: async (filters = {}) => {
    try {
      const response = await api.get('/eventos', filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
  },
  
  // Criar um novo evento
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/eventos', eventData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  },
  
  // Atualizar um evento existente
  updateEvent: async (id, eventData) => {
    try {
      const response = await api.put(`/eventos/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar evento ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir um evento
  deleteEvent: async (id) => {
    try {
      const response = await api.delete(`/eventos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir evento ${id}:`, error);
      throw error;
    }
  }
};

export default calendarService; 