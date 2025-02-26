const Event = require('../models/Event');

class CalendarService {
  async consultarEventos(filtros = {}) {
    try {
      console.log('Consultando eventos com filtros:', filtros);
      
      const query = {};
      
      // Filtrar por nome do cliente (case insensitive)
      if (filtros.nomeCliente) {
        query.nomeCliente = new RegExp(filtros.nomeCliente, 'i');
      }
      
      // Filtrar por data
      if (filtros.data) {
        const data = new Date(filtros.data);
        const inicioDia = new Date(data.setHours(0, 0, 0, 0));
        const fimDia = new Date(data.setHours(23, 59, 59, 999));
        
        query.dataHora = {
          $gte: inicioDia,
          $lte: fimDia
        };
      }
      
      // Filtrar por serviço
      if (filtros.servico) {
        query.servico = new RegExp(filtros.servico, 'i');
      }
      
      console.log('Query final:', query);
      
      // Buscar eventos ordenados por data (mais recentes primeiro)
      const eventos = await Event.find(query).sort({ dataHora: 1 });
      return eventos;
    } catch (error) {
      console.error('Erro ao consultar eventos:', error);
      throw error;
    }
  }
  
  // Método para processar datas relativas
  processarDataRelativa(dataString) {
    const hoje = new Date();
    
    // Verificar se é "hoje"
    if (/hoje/i.test(dataString)) {
      return this.formatarDataISO(hoje);
    }
    
    // Verificar se é "amanhã"
    if (/amanh[aã]/i.test(dataString)) {
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);
      return this.formatarDataISO(amanha);
    }
    
    // Verificar se é "depois de amanhã"
    if (/depois\s+de\s+amanh[aã]/i.test(dataString)) {
      const depoisDeAmanha = new Date(hoje);
      depoisDeAmanha.setDate(hoje.getDate() + 2);
      return this.formatarDataISO(depoisDeAmanha);
    }
    
    // Se não for uma data relativa, retornar a string original
    return dataString;
  }
  
  // Método para formatar data no formato ISO (YYYY-MM-DD)
  formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}

module.exports = new CalendarService();