const express = require('express');
const chatRoutes = require('./chatRoutes');
const eventosRoutes = require('./eventosRoutes');

const router = express.Router();

console.log('[Routes] Configurando rotas principais');

// Rotas de chat
router.use('/chat', chatRoutes);
console.log('[Routes] Rotas de chat configuradas');

// Rotas de eventos
router.use('/eventos', eventosRoutes);
console.log('[Routes] Rotas de eventos configuradas');

console.log('[Routes] Todas as rotas principais configuradas');

module.exports = router; 