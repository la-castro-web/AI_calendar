const CalendarController = require('./calendarController');
const axios = require('axios');

class AIController {
  constructor() {
    this.calendarController = new CalendarController();
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    
    if (!this.apiKey) {
      console.error('[AIController] DEEPSEEK_API_KEY não configurada. O sistema não funcionará corretamente.');
    } else {
      console.log('[AIController] DeepSeek API Key configurada com sucesso');
    }
  }

  // Verificar se o comando é uma confirmação
  isConfirmacao(comando) {
    const confirmacoes = ['sim', 'confirmar', 'ok', 'concordo', 'aceito', 'pode ser', 'claro', 'certo'];
    return confirmacoes.some(c => comando.toLowerCase().includes(c));
  }

  // Verificar se o comando é uma negação
  isNegacao(comando) {
    const negacoes = ['não', 'nao', 'cancela', 'cancelar', 'desisto', 'não quero', 'nao quero'];
    return negacoes.some(c => comando.toLowerCase().includes(c));
  }

  // Processar comando do usuário
  async processarComando(comando, contexto = {}) {
    console.log('Processando comando:', comando);
    
    try {
      // Se houver uma ação pendente e o comando for uma confirmação
      if (contexto.acaoPendente && this.isConfirmacao(comando)) {
        console.log('Executando ação pendente:', JSON.stringify(contexto.acaoPendente, null, 2));
        return await this.executarAcao(contexto.acaoPendente.acao, contexto.acaoPendente.dados);
      }
      
      // Se houver uma ação pendente e o comando for uma negação
      if (contexto.acaoPendente && this.isNegacao(comando)) {
        return {
          acao: 'responder',
          dados: {
            mensagem: 'Operação cancelada. Como posso ajudar você agora?'
          }
        };
      }
      
      // Consultar eventos para fornecer contexto ao DeepSeek
      console.log('[AIController] Consultando eventos com filtros:', {});
      const eventos = await this.calendarController.listarEventosFiltrados({});
      console.log(`[AIController] Encontrados ${eventos.length} eventos`);
      
      // Enviar comando para o DeepSeek
      console.log('Enviando comando para DeepSeek:', comando);
      const resposta = await this.enviarParaDeepSeek(comando, eventos);
      console.log('Resposta do DeepSeek:', resposta);
      
      // Executar a ação correspondente
      return await this.executarAcao(resposta.acao, resposta.dados);
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Desculpe, ocorreu um erro ao processar seu comando. Por favor, tente novamente.`
        }
      };
    }
  }

  // Enviar comando para a API do DeepSeek
  async enviarParaDeepSeek(comando, eventos) {
    if (!this.apiKey) {
      throw new Error('API Key do DeepSeek não configurada');
    }
    
    try {
      console.log('[AIController] Enviando comando para API DeepSeek:', comando);
      
      // Formatar eventos para incluir no prompt
      const eventosFormatados = eventos.map(e => {
        const data = new Date(e.dataHora);
        const dataFormatada = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
        const horaFormatada = `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
        
        return `- ID: ${e._id}, Cliente: ${e.nomeCliente}, Serviço: ${e.servico || 'sem serviço'}, Data: ${dataFormatada}, Hora: ${horaFormatada}, Duração: ${e.duracao || 30} minutos`;
      }).join('\n');
      
      // Formatar eventos como JSON para facilitar o processamento pelo modelo
      const eventosJSON = JSON.stringify(eventos.map(e => {
        const data = new Date(e.dataHora);
        return {
          id: e._id.toString(),
          nomeCliente: e.nomeCliente,
          servico: e.servico || 'sem serviço',
          dataHora: e.dataHora,
          data: `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}-${data.getDate().toString().padStart(2, '0')}`,
          hora: `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`,
          duracao: e.duracao || 30,
          observacoes: e.observacoes || ''
        };
      }), null, 2);
      
      // Construir o prompt com contexto
      const promptComContexto = `
Você é um assistente de agendamentos para uma barbearia. Analise o comando do usuário e retorne um JSON com a ação a ser executada.

BANCO DE DADOS ATUAL DE AGENDAMENTOS:
${eventosJSON}

Comando do usuário: "${comando}"

Ações possíveis:
- agendar: para criar um novo agendamento
- consultar: para listar agendamentos (pode filtrar por data, cliente, etc.)
- cancelar: para cancelar um agendamento
- atualizar: para modificar um agendamento existente
- responder: para responder com uma mensagem simples

Para a ação "consultar", use o seguinte formato:
{
  "acao": "consultar",
  "dados": {
    // Filtros opcionais
    "nomeCliente": "Nome do Cliente", // opcional
    "data": "YYYY-MM-DD", // opcional, para filtrar por data específica
    "servico": "corte de cabelo" // opcional
  }
}

IMPORTANTE: Quando o usuário perguntar sobre uma data específica (como "dia 27"), use o formato "YYYY-MM-DD" para a data. 
Por exemplo, para o dia 27 de fevereiro de 2025, use "2025-02-27".

Retorne APENAS um objeto JSON com a estrutura adequada, sem explicações adicionais.
`;
      
      console.log('[AIController] Enviando prompt para DeepSeek com', eventos.length, 'eventos');
      
      // Fazer a requisição para a API do DeepSeek
      const response = await axios.post(this.apiUrl, {
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: promptComContexto
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      console.log('[AIController] Resposta recebida da API DeepSeek');
      
      // Extrair a resposta
      const conteudoResposta = response.data.choices[0].message.content;
      
      // Tentar extrair JSON da resposta
      try {
        // Verificar se a resposta contém um bloco de código JSON
        const jsonMatch = conteudoResposta.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // Tentar interpretar a resposta inteira como JSON
        return JSON.parse(conteudoResposta);
      } catch (error) {
        console.error('[AIController] Erro ao extrair JSON da resposta:', error);
        console.log('[AIController] Conteúdo da resposta:', conteudoResposta);
        
        // Se não conseguir extrair JSON, retornar como resposta de texto
        return {
          acao: 'responder',
          dados: {
            mensagem: conteudoResposta
          }
        };
      }
    } catch (error) {
      console.error('[AIController] Erro ao enviar comando para DeepSeek:', error);
      throw error;
    }
  }

  // Executar ação com base na interpretação do comando
  async executarAcao(acao, dados) {
    console.log('Executando ação:', acao);
    console.log('Dados:', JSON.stringify(dados, null, 2));
    
    try {
      switch (acao) {
        case 'agendar':
          return await this.criarAgendamento(dados);
        
        case 'consultar':
          return await this.consultarAgendamentos(dados);
        
        case 'cancelar':
          return await this.cancelarAgendamento(dados);
        
        case 'atualizar':
          return await this.atualizarAgendamento(dados);
        
        case 'responder':
          return {
            acao: 'responder',
            dados: {
              mensagem: dados.mensagem
            }
          };
        
        default:
          console.warn('Ação desconhecida:', acao);
          return {
            acao: 'responder',
            dados: {
              mensagem: 'Desculpe, não entendi o que você deseja fazer.'
            }
          };
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Erro ao executar a ação: ${error.message}`
        }
      };
    }
  }

  // Método para criar um agendamento
  async criarAgendamento(dados) {
    console.log('Criando agendamento com dados:', JSON.stringify(dados, null, 2));
    
    try {
      // Mapear os campos para o formato esperado pelo calendarController
      const dadosFormatados = {
        nomeCliente: dados.nomeCliente || dados.nome || dados.cliente,
        dataHora: null,
        duracao: dados.duracao || 30,
        servico: dados.servico || 'corte de cabelo',
        observacoes: dados.observacoes || ''
      };
      
      // Processar a data/hora
      if (dados.dataHora) {
        // Se já vier no formato ISO
        dadosFormatados.dataHora = new Date(dados.dataHora);
      } else if (dados.data && dados.hora) {
        // Se vier separado em data e hora
        const [dia, mes, ano] = dados.data.split('/').map(Number);
        const [hora, minuto, segundo = 0] = dados.hora.split(':').map(Number);
        
        // Criar data no formato correto (mês em JavaScript é 0-indexed)
        dadosFormatados.dataHora = new Date(ano, mes - 1, dia, hora, minuto, segundo);
      } else if (dados.data) {
        // Se vier só a data, assumir meio-dia
        const [dia, mes, ano] = dados.data.split('/').map(Number);
        dadosFormatados.dataHora = new Date(ano, mes - 1, dia, 12, 0, 0);
      }
      
      console.log('Dados formatados para criação:', JSON.stringify(dadosFormatados, null, 2));
      
      // Validar dados essenciais
      if (!dadosFormatados.nomeCliente || !dadosFormatados.dataHora) {
        throw new Error('Nome do cliente e data/hora são obrigatórios');
      }
      
      // Criar o evento
      const novoEvento = await this.calendarController.criarEventoDireto(dadosFormatados);
      
      return {
        acao: 'responder',
        dados: {
          mensagem: `Agendamento para ${dadosFormatados.nomeCliente} criado com sucesso para ${dadosFormatados.dataHora.toLocaleString('pt-BR')}.`,
          evento: novoEvento
        }
      };
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Não foi possível criar o agendamento. Erro: ${error.message}`
        }
      };
    }
  }

  // Método para consultar agendamentos
  async consultarAgendamentos(filtros = {}) {
    console.log('Consultando eventos com filtros:', filtros);
    
    try {
      // Construir a query para o MongoDB
      const query = {};
      
      // Filtrar por cliente
      if (filtros.nomeCliente) {
        query.nomeCliente = new RegExp(filtros.nomeCliente, 'i');
      }
      
      // Filtrar por serviço
      if (filtros.servico) {
        query.servico = new RegExp(filtros.servico, 'i');
      }
      
      // Filtrar por data
      if (filtros.data) {
        let dataFiltro;
        
        // Tentar interpretar a data em vários formatos
        if (filtros.data.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Formato ISO YYYY-MM-DD
          const [ano, mes, dia] = filtros.data.split('-').map(Number);
          dataFiltro = new Date(ano, mes - 1, dia);
          console.log(`[AIController] Data ISO interpretada: ${dataFiltro.toLocaleDateString()}`);
        } else if (filtros.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Formato brasileiro DD/MM/YYYY
          const [dia, mes, ano] = filtros.data.split('/').map(Number);
          dataFiltro = new Date(ano, mes - 1, dia);
          console.log(`[AIController] Data BR interpretada: ${dataFiltro.toLocaleDateString()}`);
        } else if (filtros.data.match(/^\d{2}\/\d{2}$/)) {
          // Formato DD/MM do ano atual
          const [dia, mes] = filtros.data.split('/').map(Number);
          const anoAtual = new Date().getFullYear();
          dataFiltro = new Date(anoAtual, mes - 1, dia);
          console.log(`[AIController] Data curta interpretada: ${dataFiltro.toLocaleDateString()}`);
        } else if (filtros.data.match(/^\d{1,2}$/)) {
          // Apenas o dia do mês atual
          const dia = parseInt(filtros.data);
          const hoje = new Date();
          dataFiltro = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
          console.log(`[AIController] Dia do mês interpretado: ${dataFiltro.toLocaleDateString()}`);
        } else {
          // Tentar interpretar como data relativa
          const hoje = new Date();
          
          if (filtros.data.toLowerCase() === 'hoje') {
            dataFiltro = hoje;
            console.log(`[AIController] Data 'hoje' interpretada: ${dataFiltro.toLocaleDateString()}`);
          } else if (filtros.data.toLowerCase() === 'amanhã' || filtros.data.toLowerCase() === 'amanha') {
            dataFiltro = new Date(hoje);
            dataFiltro.setDate(hoje.getDate() + 1);
            console.log(`[AIController] Data 'amanhã' interpretada: ${dataFiltro.toLocaleDateString()}`);
          } else if (filtros.data.toLowerCase().includes('próxim') || filtros.data.toLowerCase().includes('proxim')) {
            // Próxima semana
            dataFiltro = new Date(hoje);
            dataFiltro.setDate(hoje.getDate() + 7);
            console.log(`[AIController] Data 'próxima semana' interpretada: ${dataFiltro.toLocaleDateString()}`);
          } else {
            // Tentar interpretar como data normal
            dataFiltro = new Date(filtros.data);
            console.log(`[AIController] Data genérica interpretada: ${dataFiltro.toLocaleDateString()}`);
          }
        }
        
        // Verificar se a data é válida
        if (!isNaN(dataFiltro.getTime())) {
          // Definir início e fim do dia
          const inicioDia = new Date(dataFiltro);
          inicioDia.setHours(0, 0, 0, 0);
          
          const fimDia = new Date(dataFiltro);
          fimDia.setHours(23, 59, 59, 999);
          
          query.dataHora = {
            $gte: inicioDia,
            $lte: fimDia
          };
          
          console.log(`[AIController] Consultando data: ${dataFiltro.toLocaleDateString()}`);
          console.log(`[AIController] Intervalo: ${inicioDia.toISOString()} até ${fimDia.toISOString()}`);
        } else {
          console.warn(`[AIController] Data inválida: ${filtros.data}`);
        }
      }
      
      console.log('Query final:', query);
      
      // Buscar eventos
      const eventos = await this.calendarController.listarEventosFiltrados(query);
      
      if (eventos.length === 0) {
        return {
          acao: 'responder',
          dados: {
            mensagem: 'Não encontrei nenhum agendamento com esses critérios.'
          }
        };
      }
      
      // Formatar a resposta
      const mensagem = eventos.map(evento => {
        const data = new Date(evento.dataHora).toLocaleString('pt-BR');
        return `- ${evento.nomeCliente}: ${evento.servico || 'sem serviço'} em ${data}`;
      }).join('\n');
      
      return {
        acao: 'responder',
        dados: {
          mensagem: `Encontrei os seguintes agendamentos:\n${mensagem}`
        }
      };
    } catch (error) {
      console.error('Erro ao consultar agendamentos:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Não foi possível consultar os agendamentos. Erro: ${error.message}`
        }
      };
    }
  }

  // Método para cancelar um agendamento
  async cancelarAgendamento(dados) {
    console.log('Cancelando agendamento com dados:', JSON.stringify(dados, null, 2));
    
    try {
      // Construir a query para encontrar o agendamento
      const query = {};
      
      // Filtrar por cliente
      if (dados.nomeCliente) {
        query.nomeCliente = new RegExp(dados.nomeCliente, 'i');
      }
      
      // Filtrar por data
      if (dados.data) {
        const data = new Date(dados.data);
        const inicioDia = new Date(data.setHours(0, 0, 0, 0));
        const fimDia = new Date(data.setHours(23, 59, 59, 999));
        
        query.dataHora = {
          $gte: inicioDia,
          $lte: fimDia
        };
      }
      
      console.log('Query final:', query);
      
      // Buscar eventos
      const eventos = await this.calendarController.listarEventosFiltrados(query);
      
      if (eventos.length === 0) {
        return {
          acao: 'responder',
          dados: {
            mensagem: 'Não encontrei nenhum agendamento com esses critérios para cancelar.'
          }
        };
      }
      
      // Se encontrou mais de um, pedir mais informações
      if (eventos.length > 1) {
        const mensagem = eventos.map((evento, index) => {
          const data = new Date(evento.dataHora).toLocaleString('pt-BR');
          return `${index + 1}. ${evento.nomeCliente}: ${evento.servico} em ${data}`;
        }).join('\n');
        
        return {
          acao: 'responder',
          dados: {
            mensagem: `Encontrei mais de um agendamento. Qual deles você deseja cancelar?\n${mensagem}`
          }
        };
      }
      
      // Cancelar o agendamento
      const evento = eventos[0];
      await this.calendarController.excluirEventoDireto(evento._id);
      
      return {
        acao: 'responder',
        dados: {
          mensagem: `Agendamento de ${evento.nomeCliente} para ${new Date(evento.dataHora).toLocaleString('pt-BR')} foi cancelado com sucesso.`
        }
      };
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Não foi possível cancelar o agendamento. Erro: ${error.message}`
        }
      };
    }
  }

  // Método para atualizar um agendamento
  async atualizarAgendamento(dados) {
    console.log('Atualizando agendamento com dados:', JSON.stringify(dados, null, 2));
    
    try {
      // Construir a query para encontrar o agendamento
      const query = {};
      
      // Filtrar por cliente
      if (dados.nomeCliente) {
        query.nomeCliente = new RegExp(dados.nomeCliente, 'i');
      }
      
      // Filtrar por data antiga (opcional)
      if (dados.dataAntiga) {
        const data = new Date(dados.dataAntiga);
        const inicioDia = new Date(data.setHours(0, 0, 0, 0));
        const fimDia = new Date(data.setHours(23, 59, 59, 999));
        
        query.dataHora = {
          $gte: inicioDia,
          $lte: fimDia
        };
      }
      
      console.log('Query final:', query);
      
      // Buscar eventos
      const eventos = await this.calendarController.listarEventosFiltrados(query);
      
      if (eventos.length === 0) {
        return {
          acao: 'responder',
          dados: {
            mensagem: 'Não encontrei nenhum agendamento com esses critérios para atualizar.'
          }
        };
      }
      
      // Se encontrou mais de um, pedir mais informações
      if (eventos.length > 1) {
        const mensagem = eventos.map((evento, index) => {
          const data = new Date(evento.dataHora).toLocaleString('pt-BR');
          return `${index + 1}. ${evento.nomeCliente}: ${evento.servico} em ${data}`;
        }).join('\n');
        
        return {
          acao: 'responder',
          dados: {
            mensagem: `Encontrei mais de um agendamento. Qual deles você deseja atualizar?\n${mensagem}`
          }
        };
      }
      
      // Atualizar o agendamento
      const evento = eventos[0];
      const atualizacoes = {};
      
      // Atualizar data/hora
      if (dados.dataNova) {
        atualizacoes.dataHora = new Date(dados.dataNova);
      }
      
      // Atualizar serviço
      if (dados.servico) {
        atualizacoes.servico = dados.servico;
      }
      
      // Atualizar duração
      if (dados.duracao) {
        atualizacoes.duracao = dados.duracao;
      }
      
      // Atualizar observações
      if (dados.observacoes) {
        atualizacoes.observacoes = dados.observacoes;
      }
      
      await this.calendarController.atualizarEventoDireto(evento._id, atualizacoes);
      
      return {
        acao: 'responder',
        dados: {
          mensagem: `Agendamento de ${evento.nomeCliente} foi atualizado com sucesso.`
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      return {
        acao: 'responder',
        dados: {
          mensagem: `Não foi possível atualizar o agendamento. Erro: ${error.message}`
        }
      };
    }
  }
}

module.exports = AIController;