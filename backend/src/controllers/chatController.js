const AIController = require('./aiController');
const Chat = require('../models/Chat');

class ChatController {
  constructor() {
    this.aiController = new AIController();
    this.contexto = {};
  }

  async processMessage(req, res) {
    try {
      console.log('Mensagem recebida:', req.body.message);
      
      if (!req.body.message) {
        return res.status(400).json({ error: 'Mensagem não fornecida' });
      }
      
      // Processar a mensagem usando o AIController
      const resultado = await this.aiController.processarComando(req.body.message, this.contexto);
      
      // Atualizar o contexto se necessário
      if (resultado.requerConfirmacao) {
        this.contexto.acaoPendente = {
          acao: resultado.acao,
          dados: resultado.dados
        };
      } else {
        // Limpar o contexto se não precisar de confirmação
        this.contexto = {};
      }
      
      // Verificar se a resposta contém uma mensagem
      if (resultado && resultado.dados && resultado.dados.mensagem) {
        console.log('Resposta para o cliente:', resultado.dados.mensagem);
        return res.json({ message: resultado.dados.mensagem });
      } else {
        console.error('Resposta do AI não contém mensagem:', resultado);
        return res.json({ message: 'Desculpe, não consegui processar sua solicitação.' });
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      res.status(500).json({ error: 'Erro ao processar mensagem', details: error.message });
    }
  }
  
  async obterHistorico(req, res) {
    try {
      const historico = await Chat.find().sort({ timestamp: 1 });
      return res.json({ sucesso: true, historico });
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  }
  
  async clearHistory(req, res) {
    try {
      this.aiController.limparHistorico();
      
      return res.json({
        success: true,
        message: 'Histórico de conversa limpo com sucesso'
      });
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      return res.status(500).json({ 
        error: 'Erro ao limpar histórico',
        details: error.message
      });
    }
  }
}

// Exportar a classe, não uma instância
module.exports = ChatController;