const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  remetente: {
    type: String,
    required: true,
    enum: ['usuario', 'assistente']
  },
  texto: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  erro: {
    type: Boolean,
    default: false
  }
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 