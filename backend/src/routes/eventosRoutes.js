const express = require('express');
const CalendarController = require('../controllers/calendarController');

const router = express.Router();
const calendarController = new CalendarController();

console.log('[EventosRoutes] Configurando rotas de eventos');

// Rota para criar um novo evento
router.post('/', calendarController.criarEvento.bind(calendarController));
console.log('[EventosRoutes] Rota POST / configurada');

// Rota para listar todos os eventos
router.get('/', calendarController.listarEventos.bind(calendarController));
console.log('[EventosRoutes] Rota GET / configurada');

// Rota para obter um evento específico
router.get('/:id', calendarController.obterEvento.bind(calendarController));
console.log('[EventosRoutes] Rota GET /:id configurada');

// Rota para atualizar um evento
router.put('/:id', calendarController.atualizarEvento.bind(calendarController));
console.log('[EventosRoutes] Rota PUT /:id configurada');

// Rota para excluir um evento
router.delete('/:id', calendarController.excluirEvento.bind(calendarController));
console.log('[EventosRoutes] Rota DELETE /:id configurada');

console.log('[EventosRoutes] Todas as rotas de eventos configuradas');

module.exports = router; 