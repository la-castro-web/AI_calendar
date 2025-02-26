const fs = require('fs').promises;
const path = require('path');
const Evento = require('../models/Evento');
const mongoose = require('mongoose');

class CalendarController {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/eventos.json');
    this.ensureDataFile();
  }

  // Garantir que o arquivo de dados existe
  async ensureDataFile() {
    try {
      await fs.access(this.dataPath);
    } catch (error) {
      // Se o arquivo não existir, criar um novo com array vazio
      const dirPath = path.dirname(this.dataPath);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (err) {
        // Diretório já existe, ignorar erro
      }
      await fs.writeFile(this.dataPath, JSON.stringify([]));
    }
  }

  // Ler todos os eventos do arquivo
  async getEventos() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler eventos:', error);
      return [];
    }
  }

  // Salvar eventos no arquivo
  async saveEventos(eventos) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(eventos, null, 2));
    } catch (error) {
      console.error('Erro ao salvar eventos:', error);
      throw error;
    }
  }

  // Listar todos os eventos
  async listarEventos(req, res) {
    console.log('[CalendarController] Iniciando listarEventos');
    try {
      // Verificar as coleções disponíveis
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('[CalendarController] Coleções disponíveis:', collections.map(c => c.name));
      
      // Verificar o nome da coleção que o modelo está usando
      console.log('[CalendarController] Nome da coleção do modelo:', Evento.collection.name);
      
      console.log('[CalendarController] Buscando eventos no MongoDB');
      
      // Tentar buscar diretamente da coleção events
      const db = mongoose.connection.db;
      const eventsCollection = db.collection('events');
      const eventosRaw = await eventsCollection.find({}).toArray();
      console.log(`[CalendarController] Eventos encontrados diretamente na coleção 'events': ${eventosRaw.length}`);
      
      // Buscar usando o modelo
      const eventos = await Evento.find({});
      console.log(`[CalendarController] Eventos encontrados usando o modelo: ${eventos.length}`);
      
      // Usar os eventos encontrados diretamente se o modelo não retornar nada
      const resultados = eventos.length > 0 ? eventos : eventosRaw;
      console.log('[CalendarController] Dados dos eventos:', JSON.stringify(resultados, null, 2));
      
      res.json(resultados);
    } catch (error) {
      console.error('[CalendarController] Erro ao listar eventos:', error);
      res.status(500).json({ error: 'Erro ao listar eventos', details: error.message });
    }
  }

  // Obter um evento específico
  async obterEvento(req, res) {
    console.log(`[CalendarController] Iniciando obterEvento com ID: ${req.params.id}`);
    try {
      const evento = await Evento.findById(req.params.id);
      
      if (!evento) {
        console.log(`[CalendarController] Evento com ID ${req.params.id} não encontrado`);
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      console.log(`[CalendarController] Evento encontrado:`, JSON.stringify(evento, null, 2));
      res.json(evento);
    } catch (error) {
      console.error(`[CalendarController] Erro ao obter evento ${req.params.id}:`, error);
      res.status(500).json({ error: 'Erro ao obter evento', details: error.message });
    }
  }

  // Criar um novo evento (versão para API REST)
  async criarEvento(req, res) {
    console.log('[CalendarController] Iniciando criarEvento');
    console.log('[CalendarController] Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    try {
      const { nomeCliente, servico, dataHora, duracao, observacoes } = req.body;
      
      if (!nomeCliente || !dataHora) {
        console.log('[CalendarController] Dados inválidos: nome do cliente e data/hora são obrigatórios');
        return res.status(400).json({ error: 'Nome do cliente e data/hora são obrigatórios' });
      }
      
      const novoEvento = new Evento({
        nomeCliente,
        servico: servico || '',
        dataHora,
        duracao: duracao || 30,
        observacoes: observacoes || '',
        createdAt: new Date()
      });
      
      console.log('[CalendarController] Salvando novo evento no MongoDB');
      await novoEvento.save();
      console.log('[CalendarController] Evento salvo com sucesso:', JSON.stringify(novoEvento, null, 2));
      
      res.status(201).json(novoEvento);
    } catch (error) {
      console.error('[CalendarController] Erro ao criar evento:', error);
      res.status(500).json({ error: 'Erro ao criar evento', details: error.message });
    }
  }

  // Criar evento diretamente (para uso por outros controladores)
  async criarEventoDireto(dados) {
    console.log('[CalendarController] Iniciando criarEventoDireto');
    console.log('[CalendarController] Dados recebidos:', JSON.stringify(dados, null, 2));
    
    try {
      // Validar dados essenciais
      if (!dados.nomeCliente || !dados.dataHora) {
        console.log('[CalendarController] Dados inválidos: nome do cliente e data/hora são obrigatórios');
        throw new Error('Nome do cliente e data/hora são obrigatórios');
      }
      
      // Criar o objeto do evento
      const novoEvento = new Evento({
        nomeCliente: dados.nomeCliente,
        dataHora: dados.dataHora,
        duracao: dados.duracao || 30,
        servico: dados.servico || 'corte de cabelo',
        observacoes: dados.observacoes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Salvar o evento
      console.log('[CalendarController] Salvando evento:', JSON.stringify(novoEvento, null, 2));
      await novoEvento.save();
      
      console.log('[CalendarController] Evento salvo com sucesso:', JSON.stringify(novoEvento, null, 2));
      return novoEvento;
    } catch (error) {
      console.error('[CalendarController] Erro ao criar evento:', error);
      throw error;
    }
  }

  // Atualizar um evento existente
  async atualizarEvento(req, res) {
    console.log(`[CalendarController] Iniciando atualizarEvento com ID: ${req.params.id}`);
    console.log('[CalendarController] Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    try {
      const { nomeCliente, servico, dataHora } = req.body;
      
      if (!nomeCliente || !dataHora) {
        console.log('[CalendarController] Dados inválidos: nome do cliente e data/hora são obrigatórios');
        return res.status(400).json({ error: 'Nome do cliente e data/hora são obrigatórios' });
      }
      
      console.log(`[CalendarController] Buscando evento com ID ${req.params.id} para atualizar`);
      const evento = await Evento.findById(req.params.id);
      
      if (!evento) {
        console.log(`[CalendarController] Evento com ID ${req.params.id} não encontrado`);
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      evento.nomeCliente = nomeCliente;
      evento.servico = servico || evento.servico;
      evento.dataHora = dataHora;
      evento.updatedAt = new Date();
      
      console.log('[CalendarController] Salvando evento atualizado');
      await evento.save();
      console.log('[CalendarController] Evento atualizado com sucesso:', JSON.stringify(evento, null, 2));
      
      res.json(evento);
    } catch (error) {
      console.error(`[CalendarController] Erro ao atualizar evento ${req.params.id}:`, error);
      res.status(500).json({ error: 'Erro ao atualizar evento', details: error.message });
    }
  }

  // Excluir um evento
  async excluirEvento(req, res) {
    console.log(`[CalendarController] Iniciando excluirEvento com ID: ${req.params.id}`);
    
    try {
      console.log(`[CalendarController] Buscando e excluindo evento com ID ${req.params.id}`);
      const resultado = await Evento.findByIdAndDelete(req.params.id);
      
      if (!resultado) {
        console.log(`[CalendarController] Evento com ID ${req.params.id} não encontrado`);
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      console.log(`[CalendarController] Evento excluído com sucesso:`, JSON.stringify(resultado, null, 2));
      res.json({ message: 'Evento excluído com sucesso' });
    } catch (error) {
      console.error(`[CalendarController] Erro ao excluir evento ${req.params.id}:`, error);
      res.status(500).json({ error: 'Erro ao excluir evento', details: error.message });
    }
  }

  // Listar eventos com filtros
  async listarEventosFiltrados(filtros = {}) {
    console.log('[CalendarController] Iniciando listarEventosFiltrados');
    console.log('[CalendarController] Filtros:', JSON.stringify(filtros, null, 2));
    
    try {
      // Converter datas de string para objeto Date se necessário
      if (filtros.dataHora && typeof filtros.dataHora === 'object') {
        if (filtros.dataHora.$gte && typeof filtros.dataHora.$gte === 'string') {
          filtros.dataHora.$gte = new Date(filtros.dataHora.$gte);
        }
        if (filtros.dataHora.$lte && typeof filtros.dataHora.$lte === 'string') {
          filtros.dataHora.$lte = new Date(filtros.dataHora.$lte);
        }
      }
      
      console.log('[CalendarController] Buscando eventos no MongoDB com filtros');
      
      // Tentar buscar usando o modelo
      const eventos = await Evento.find(filtros).sort({ dataHora: 1 });
      console.log(`[CalendarController] Eventos encontrados: ${eventos.length}`);
      
      // Se não encontrar nada com o modelo, tentar buscar diretamente da coleção
      if (eventos.length === 0) {
        console.log('[CalendarController] Tentando buscar diretamente da coleção events');
        const db = mongoose.connection.db;
        const eventsCollection = db.collection('events');
        const eventosRaw = await eventsCollection.find(filtros).sort({ dataHora: 1 }).toArray();
        console.log(`[CalendarController] Eventos encontrados diretamente: ${eventosRaw.length}`);
        return eventosRaw;
      }
      
      return eventos;
    } catch (error) {
      console.error('[CalendarController] Erro ao listar eventos filtrados:', error);
      throw error;
    }
  }

  // Excluir evento diretamente (para uso por outros controladores)
  async excluirEventoDireto(id) {
    console.log(`[CalendarController] Iniciando excluirEventoDireto para ID: ${id}`);
    
    try {
      // Verificar se o ID é válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`[CalendarController] ID inválido: ${id}`);
        throw new Error('ID de evento inválido');
      }
      
      // Buscar o evento para verificar se existe
      const evento = await Evento.findById(id);
      
      if (!evento) {
        console.error(`[CalendarController] Evento não encontrado com ID: ${id}`);
        throw new Error('Evento não encontrado');
      }
      
      // Excluir o evento
      console.log(`[CalendarController] Excluindo evento com ID: ${id}`);
      const resultado = await Evento.findByIdAndDelete(id);
      
      if (!resultado) {
        console.error(`[CalendarController] Falha ao excluir evento com ID: ${id}`);
        throw new Error('Falha ao excluir evento');
      }
      
      console.log(`[CalendarController] Evento excluído com sucesso:`, JSON.stringify(resultado, null, 2));
      return resultado;
    } catch (error) {
      console.error(`[CalendarController] Erro ao excluir evento ${id}:`, error);
      throw error;
    }
  }

  // Atualizar evento diretamente (para uso por outros controladores)
  async atualizarEventoDireto(id, dadosAtualizados) {
    console.log(`[CalendarController] Iniciando atualizarEventoDireto para ID: ${id}`);
    console.log(`[CalendarController] Dados atualizados:`, JSON.stringify(dadosAtualizados, null, 2));
    
    try {
      // Verificar se o ID é válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`[CalendarController] ID inválido: ${id}`);
        throw new Error('ID de evento inválido');
      }
      
      // Buscar o evento para verificar se existe
      const evento = await Evento.findById(id);
      
      if (!evento) {
        console.error(`[CalendarController] Evento não encontrado com ID: ${id}`);
        throw new Error('Evento não encontrado');
      }
      
      // Adicionar data de atualização
      dadosAtualizados.updatedAt = new Date();
      
      // Atualizar o evento
      console.log(`[CalendarController] Atualizando evento com ID: ${id}`);
      const eventoAtualizado = await Evento.findByIdAndUpdate(
        id,
        dadosAtualizados,
        { new: true, runValidators: true }
      );
      
      if (!eventoAtualizado) {
        console.error(`[CalendarController] Falha ao atualizar evento com ID: ${id}`);
        throw new Error('Falha ao atualizar evento');
      }
      
      console.log(`[CalendarController] Evento atualizado com sucesso:`, JSON.stringify(eventoAtualizado, null, 2));
      return eventoAtualizado;
    } catch (error) {
      console.error(`[CalendarController] Erro ao atualizar evento ${id}:`, error);
      throw error;
    }
  }
}

module.exports = CalendarController;
