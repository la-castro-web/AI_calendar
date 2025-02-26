const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de dados
const DATA_FILE = path.join(__dirname, '../../data/events.json');

// Garantir que o diretório data existe
try {
  if (!fs.existsSync(path.join(__dirname, '../../data'))) {
    fs.mkdirSync(path.join(__dirname, '../../data'));
  }
} catch (err) {
  console.error('Erro ao criar diretório de dados:', err);
}

// Carregar eventos do arquivo
let events = [];
let eventId = 1;

try {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    events = JSON.parse(data);
    
    // Encontrar o maior ID para continuar a sequência
    if (events.length > 0) {
      const maxId = Math.max(...events.map(e => parseInt(e._id)));
      eventId = maxId + 1;
    }
    
    console.log(`Carregados ${events.length} eventos do arquivo`);
  } else {
    console.log('Arquivo de dados não encontrado, iniciando com banco vazio');
    // Criar arquivo vazio
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
} catch (err) {
  console.error('Erro ao carregar eventos do arquivo:', err);
}

// Função para salvar eventos no arquivo
const saveEvents = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
    console.log(`Salvos ${events.length} eventos no arquivo`);
  } catch (err) {
    console.error('Erro ao salvar eventos no arquivo:', err);
  }
};

module.exports = {
  findEvents: (query = {}) => {
    console.log('Mock DB - Buscando eventos com query:', query);
    console.log('Mock DB - Eventos atuais:', events);
    
    return Promise.resolve(events.filter(event => {
      if (query.nomeCliente && event.nomeCliente !== query.nomeCliente) return false;
      if (query.data) {
        const queryDate = new Date(query.data);
        const eventDate = new Date(event.dataHora);
        if (queryDate.toDateString() !== eventDate.toDateString()) return false;
      }
      return true;
    }));
  },
  
  createEvent: (eventData) => {
    console.log('Mock DB - Criando evento:', eventData);
    const newEvent = {
      _id: String(eventId++),
      ...eventData,
      createdAt: new Date()
    };
    events.push(newEvent);
    console.log('Mock DB - Evento criado:', newEvent);
    console.log('Mock DB - Eventos atuais:', events);
    
    // Salvar no arquivo
    saveEvents();
    
    return Promise.resolve(newEvent);
  },
  
  updateEvent: (id, eventData) => {
    console.log('Mock DB - Atualizando evento:', id, eventData);
    const index = events.findIndex(e => e._id === id);
    if (index === -1) return Promise.resolve(null);
    
    events[index] = {
      ...events[index],
      ...eventData
    };
    console.log('Mock DB - Evento atualizado:', events[index]);
    
    // Salvar no arquivo
    saveEvents();
    
    return Promise.resolve(events[index]);
  },
  
  deleteEvent: (id) => {
    console.log('Mock DB - Deletando evento:', id);
    const index = events.findIndex(e => e._id === id);
    if (index === -1) return Promise.resolve(false);
    
    const deletedEvent = events[index];
    events.splice(index, 1);
    console.log('Mock DB - Evento deletado:', deletedEvent);
    console.log('Mock DB - Eventos atuais:', events);
    
    // Salvar no arquivo
    saveEvents();
    
    return Promise.resolve(true);
  }
}; 