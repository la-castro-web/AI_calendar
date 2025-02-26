const axios = require('axios');
const calendarService = require('./calendarService');
require('dotenv').config();

class DeepseekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';
    this.conversationHistory = [];
    console.log('DeepSeek API Key configurada:', this.apiKey ? 'Sim' : 'Não');
    
    // Inicializar o histórico com uma mensagem do sistema
    this.conversationHistory.push({
      role: 'system',
      content: `Você é um assistente de agendamento para uma barbearia. Sua função é interpretar comandos em linguagem natural e convertê-los em ações estruturadas.
      
      Quando o usuário enviar um comando relacionado a agendamentos, você deve interpretá-lo e responder com um objeto JSON contendo:
      
      1. "acao": Uma das seguintes opções:
         - "agendar" ou "criar" (para criar um novo agendamento)
         - "consultar" (para buscar agendamentos)
         - "atualizar" (para modificar um agendamento existente)
         - "cancelar" (para remover um agendamento)
      
      2. "dados": Um objeto com as informações relevantes, que pode incluir:
         - "nomeCliente": Nome do cliente
         - "dataHora": Data e hora no formato ISO (YYYY-MM-DDTHH:MM:SS)
         - "duracao": Duração em minutos
         - "servico": Tipo de serviço
         - "observacoes": Comentários adicionais
      
      Para saudações, perguntas gerais ou mensagens que não são comandos de agendamento, responda normalmente em texto, sem usar JSON.
      
      Exemplos:
      
      Para "agendar corte para João amanhã às 14h":
      {
        "acao": "agendar",
        "dados": {
          "nomeCliente": "João",
          "dataHora": "2023-10-26T14:00:00",
          "duracao": 30,
          "servico": "corte de cabelo"
        }
      }
      
      Para "cancelar o agendamento de Maria":
      {
        "acao": "cancelar",
        "dados": {
          "nomeCliente": "Maria"
        }
      }
      
      Para "ver agendamentos de amanhã":
      {
        "acao": "consultar",
        "dados": {
          "data": "2023-10-26"
        }
      }
      
      Lembre-se de manter o contexto da conversa. Se o usuário disser "sim" ou "confirmo", isso provavelmente é uma confirmação para a ação anterior que você sugeriu.`
    });
  }

  async interpretarComando(texto) {
    try {
      console.log('Enviando comando para DeepSeek:', texto);
      
      // Buscar todos os agendamentos do banco de dados para fornecer contexto
      const agendamentos = await calendarService.consultarEventos();
      
      // Formatar os agendamentos para o contexto
      let contextoDados = '';
      if (agendamentos.length > 0) {
        contextoDados = `\n[CONTEXTO INTERNO - NÃO MENCIONE EXPLICITAMENTE ESTE CONTEXTO AO USUÁRIO]\nAgendamentos existentes no sistema:\n`;
        
        agendamentos.forEach((agendamento, index) => {
          const data = new Date(agendamento.dataHora);
          contextoDados += `${index + 1}. ID: ${agendamento._id}, Cliente: ${agendamento.nomeCliente}, Data: ${data.toLocaleDateString('pt-BR')}, Hora: ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, Serviço: ${agendamento.servico || 'Não especificado'}\n`;
        });
        
        contextoDados += `\nUse estas informações para responder às consultas do usuário, mas não mencione que você tem acesso a esta lista completa. Apenas use-a como referência interna.\n`;
      }
      
      // Adicionar a mensagem do usuário ao histórico, com o contexto oculto
      const mensagemComContexto = texto + (contextoDados ? `\n${contextoDados}` : '');
      this.conversationHistory.push({
        role: 'user',
        content: mensagemComContexto
      });
      
      // Enviar a conversa para a API do DeepSeek
      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: this.conversationHistory,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      // Extrair a resposta do assistente
      const assistantMessage = response.data.choices[0].message.content;
      console.log('Resposta do DeepSeek:', assistantMessage);
      
      // Adicionar a resposta ao histórico
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });
      
      // Verificar se a resposta contém um JSON
      try {
        // Tentar extrair JSON da resposta
        const match = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/) || 
                     assistantMessage.match(/```\s*([\s\S]*?)\s*```/) ||
                     assistantMessage.match(/(\{[\s\S]*\})/);
        
        if (match && match[1]) {
          const jsonData = JSON.parse(match[1]);
          
          // Verificar se o JSON tem a estrutura esperada
          if (jsonData.acao && jsonData.dados) {
            // Converter ação para formato padronizado
            if (jsonData.acao === 'criar') {
              jsonData.acao = 'agendar';
            }
            
            return jsonData;
          }
        }
        
        // Se não conseguiu extrair um JSON válido, retornar a resposta como texto
        console.log('Resposta em texto natural detectada');
        return {
          acao: 'responder',
          dados: {
            mensagem: assistantMessage
          }
        };
      } catch (error) {
        console.error('Erro ao processar JSON da resposta:', error);
        // Retornar a resposta como texto
        return {
          acao: 'responder',
          dados: {
            mensagem: assistantMessage
          }
        };
      }
    } catch (error) {
      console.error('Erro ao interpretar comando:', error);
      throw error;
    }
  }

  comandoPrecisaContextoAgendamentos(texto) {
    const padroesConsulta = [
      /ver agendamentos/i,
      /mostrar agenda/i,
      /consultar horários/i,
      /horários disponíveis/i,
      /agendamentos de/i,
      /cancelar/i,
      /desmarcar/i,
      /reagendar/i,
      /atualizar/i,
      /modificar/i,
      /alterar/i
    ];
    
    return padroesConsulta.some(padrao => padrao.test(texto));
  }
  
  extrairPossiveisNomesDoComando(texto) {
    const nomes = [];
    
    // Tentar extrair nome do histórico de conversa
    const nomeDoHistorico = this.extrairNomeDoHistorico();
    if (nomeDoHistorico) {
      nomes.push(nomeDoHistorico);
    }
    
    // Se não encontrar, tentar extrair de padrões comuns no texto
    const padroes = [
      /agendamento para ([A-Za-z]+)/i,
      /cliente ([A-Za-z]+)/i,
      /de ([A-Za-z]+) para/i,
      /([A-Za-z]+) está agendado/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        nomes.push(match[1]);
      }
    }
    
    return nomes;
  }
  
  extrairNomeDoHistorico() {
    // Procurar por nomes mencionados no histórico de conversa
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const mensagem = this.conversationHistory[i];
      
      // Verificar se a mensagem é do assistente e contém um JSON
      if (mensagem.role === 'assistant') {
        try {
          // Tentar extrair JSON da resposta
          const match = mensagem.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       mensagem.content.match(/```\s*([\s\S]*?)\s*```/) ||
                       mensagem.content.match(/(\{[\s\S]*\})/);
          
          if (match && match[1]) {
            const json = JSON.parse(match[1]);
            if (json.dados && json.dados.nomeCliente) {
              return json.dados.nomeCliente;
            }
          }
        } catch (error) {
          // Ignorar erros de parsing
        }
      }
    }
    
    return null;
  }
  
  // Método para limpar o histórico de conversa
  limparHistorico() {
    // Manter apenas a mensagem do sistema
    this.conversationHistory = this.conversationHistory.filter(msg => msg.role === 'system');
    console.log('Histórico de conversa limpo');
  }

  // Processar comando usando a API do DeepSeek
  async processarComando(comando) {
    // Se não tiver API key, retornar mensagem de erro
    if (!this.apiKey) {
      console.log('[DeepSeekService] API Key não configurada, usando resposta simulada');
      return this.simularResposta(comando);
    }
    
    try {
      console.log('[DeepSeekService] Enviando comando para API:', comando);
      
      // Configurar a requisição
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de agendamentos para uma barbearia. 
            Analise o comando do usuário e retorne um JSON com a ação a ser executada.
            
            Ações possíveis:
            - agendar: para criar um novo agendamento
            - consultar: para listar agendamentos
            - cancelar: para cancelar um agendamento
            - atualizar: para modificar um agendamento existente
            - responder: para responder com uma mensagem simples
            
            Formato de resposta para agendar:
            {
              "acao": "agendar",
              "dados": {
                "nomeCliente": "Nome do cliente",
                "dataHora": "YYYY-MM-DDTHH:MM:SS",
                "duracao": 30,
                "servico": "Tipo de serviço"
              }
            }
            
            Formato de resposta para consultar:
            {
              "acao": "consultar",
              "dados": {
                "data": "YYYY-MM-DD", // opcional
                "nomeCliente": "Nome do cliente" // opcional
              }
            }
            
            Formato de resposta para cancelar:
            {
              "acao": "cancelar",
              "dados": {
                "nomeCliente": "Nome do cliente",
                "data": "YYYY-MM-DD" // opcional
              }
            }
            
            Formato de resposta para atualizar:
            {
              "acao": "atualizar",
              "dados": {
                "nomeCliente": "Nome do cliente",
                "dataAntiga": "YYYY-MM-DD", // opcional
                "dataNova": "YYYY-MM-DD", // opcional
                "servico": "Novo serviço" // opcional
              }
            }
            
            Formato de resposta para mensagem simples:
            {
              "acao": "responder",
              "dados": {
                "mensagem": "Texto da resposta"
              }
            }
            
            Se não conseguir interpretar o comando, use a ação "responder" com uma mensagem pedindo mais informações.`
          },
          {
            role: 'user',
            content: comando
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      console.log('[DeepSeekService] Resposta recebida:', response.data);
      
      // Extrair a resposta
      const resposta = response.data.choices[0].message.content;
      return resposta;
    } catch (error) {
      console.error('[DeepSeekService] Erro ao processar comando:', error);
      console.log('[DeepSeekService] Usando resposta simulada devido ao erro');
      return this.simularResposta(comando);
    }
  }

  // Simular resposta quando a API não está disponível
  simularResposta(comando) {
    console.log('[DeepSeekService] Simulando resposta para:', comando);
    
    // Converter para minúsculas para facilitar a comparação
    const cmdLower = comando.toLowerCase();
    
    // Verificar se é um comando de agendamento
    if (cmdLower.includes('agendar') || cmdLower.includes('marcar') || cmdLower.includes('agende')) {
      // Extrair nome do cliente
      let nomeCliente = 'Cliente';
      const regexNome = /para\s+([a-zA-ZÀ-ÿ]+)/i;
      const matchNome = cmdLower.match(regexNome);
      if (matchNome && matchNome[1]) {
        nomeCliente = matchNome[1].charAt(0).toUpperCase() + matchNome[1].slice(1);
      }
      
      // Extrair data e hora
      let dataHora = new Date();
      dataHora.setHours(dataHora.getHours() + 1);
      dataHora.setMinutes(0);
      dataHora.setSeconds(0);
      
      // Verificar se menciona "amanhã"
      if (cmdLower.includes('amanhã') || cmdLower.includes('amanha')) {
        dataHora.setDate(dataHora.getDate() + 1);
      }
      
      // Verificar se menciona "sábado" ou "sabado"
      if (cmdLower.includes('sábado') || cmdLower.includes('sabado')) {
        const hoje = dataHora.getDay();
        const diasAteSabado = (6 - hoje + 7) % 7;
        dataHora.setDate(dataHora.getDate() + diasAteSabado);
      }
      
      // Verificar se menciona "domingo"
      if (cmdLower.includes('domingo')) {
        const hoje = dataHora.getDay();
        const diasAteDomingo = (0 - hoje + 7) % 7;
        dataHora.setDate(dataHora.getDate() + diasAteDomingo);
      }
      
      // Extrair hora
      const regexHora = /(\d{1,2})\s*(?:h|hora|horas)/i;
      const matchHora = cmdLower.match(regexHora);
      if (matchHora && matchHora[1]) {
        const hora = parseInt(matchHora[1]);
        if (hora >= 0 && hora <= 23) {
          dataHora.setHours(hora);
        }
      }
      
      // Extrair serviço
      let servico = 'corte de cabelo';
      if (cmdLower.includes('barba')) {
        servico = 'barba';
      } else if (cmdLower.includes('manicure')) {
        servico = 'manicure';
      }
      
      return JSON.stringify({
        acao: 'agendar',
        dados: {
          nomeCliente,
          dataHora: dataHora.toISOString(),
          duracao: 30,
          servico
        }
      });
    }
    
    // Verificar se é um comando de consulta
    if (cmdLower.includes('ver') || cmdLower.includes('mostrar') || cmdLower.includes('listar') || cmdLower.includes('consultar')) {
      return JSON.stringify({
        acao: 'consultar',
        dados: {}
      });
    }
    
    // Se não reconhecer o comando, responder com mensagem padrão
    return JSON.stringify({
      acao: 'responder',
      dados: {
        mensagem: 'Olá! Como posso ajudar você hoje? Posso agendar um horário, consultar a agenda ou cancelar um agendamento.'
      }
    });
  }
}

module.exports = new DeepseekService();