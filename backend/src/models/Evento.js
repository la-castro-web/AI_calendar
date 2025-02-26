const mongoose = require('mongoose');

console.log('[Evento Model] Definindo schema do Evento');

const eventoSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: true
  },
  servico: {
    type: String,
    default: ''
  },
  dataHora: {
    type: Date,
    required: true
  },
  duracao: {
    type: Number,
    default: 30
  },
  observacoes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  __v: {
    type: Number,
    default: 0
  }
}, { 
  collection: 'events' // Importante: especifica o nome da coleção
});

console.log('[Evento Model] Schema do Evento definido com sucesso');

const Evento = mongoose.model('Evento', eventoSchema);

console.log('[Evento Model] Modelo Evento criado com sucesso');

module.exports = Evento; 