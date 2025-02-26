const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: true,
    trim: true
  },
  dataHora: {
    type: Date,
    required: true
  },
  duracao: {
    type: Number,
    default: 30, // Duração padrão em minutos
    min: 5
  },
  servico: {
    type: String,
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhorar a performance das consultas
eventSchema.index({ nomeCliente: 1 });
eventSchema.index({ dataHora: 1 });

// Método para converter para JSON com data local
eventSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Converter a data UTC para string ISO
  if (obj.dataHora) {
    obj.dataHora = obj.dataHora.toISOString();
  }
  
  return obj;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 