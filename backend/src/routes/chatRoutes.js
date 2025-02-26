const express = require('express');
const ChatController = require('../controllers/chatController');

const router = express.Router();
const chatController = new ChatController();

// Rota para processar mensagens
router.post('/message', chatController.processMessage.bind(chatController));

// Rota para limpar histórico
router.post('/clear', chatController.clearHistory.bind(chatController));

// Rota para obter histórico de chat
router.get('/historico', async (req, res) => {
  try {
    // Implementar lógica para obter histórico
    res.json({ success: true, messages: [] });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
});

module.exports = router; 