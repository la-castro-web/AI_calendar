const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const Event = require('../models/Event');

// Rota para processar comandos em linguagem natural
router.post('/comando', (req, res) => calendarController.processarComando(req, res));

// Rotas REST tradicionais
router.post('/eventos', async (req, res) => {
  try {
    const evento = new Event(req.body);
    const resultado = await evento.save();
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/eventos', async (req, res) => {
  try {
    const query = {};
    
    if (req.query.data) {
      const data = new Date(req.query.data);
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      
      query.dataHora = { $gte: dataInicio, $lte: dataFim };
    }
    
    if (req.query.nomeCliente) {
      query.nomeCliente = req.query.nomeCliente;
    }
    
    const eventos = await Event.find(query);
    res.json(eventos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/eventos/:id', async (req, res) => {
  try {
    const resultado = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/eventos/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Evento deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
