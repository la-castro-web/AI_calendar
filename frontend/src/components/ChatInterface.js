import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSpinner, FaRobot, FaUser, FaTrash } from 'react-icons/fa';
import VoiceInput from './VoiceInput';
import api from '../services/api';
import './ChatInterface.css';

const ChatInterface = ({ onCommandProcessed }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focar no input quando o componente montar
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Rolar para o final quando novas mensagens forem adicionadas
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Adicionar mensagem do usuário ao chat
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text: userMessage, 
      sender: 'user' 
    }]);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Enviando mensagem para o backend:', userMessage);
      
      // Enviar mensagem para o backend
      const response = await api.post('/chat/message', { message: userMessage });
      console.log('Resposta do backend:', response.data);
      
      // Verificar se a resposta foi bem-sucedida
      if (response.data) {
        // Adicionar resposta do assistente ao chat
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: response.data.message, 
          sender: 'assistant',
          data: response.data.data || null,
          requiresConfirmation: response.data.requiresConfirmation || false
        }]);
        
        // Se houver dados de evento, notificar o componente pai
        if (response.data.data && onCommandProcessed) {
          onCommandProcessed(response.data);
        }
      } else {
        // Se a resposta não foi bem-sucedida, mostrar erro
        setError(response.data.error || 'Erro ao processar mensagem');
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: response.data.error || 'Erro ao processar mensagem', 
          sender: 'error' 
        }]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Mostrar mensagem de erro no chat
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Erro ao processar mensagem';
      setError(errorMessage);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: errorMessage, 
        sender: 'error' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      setLoading(true);
      
      // Chamar API para limpar histórico no backend
      await api.post('/chat/clear');
      
      // Limpar mensagens no frontend
      setMessages([]);
      setError(null);
      
      // Adicionar mensagem de confirmação
      setMessages([{ 
        id: Date.now(), 
        text: 'Histórico de conversa limpo.', 
        sender: 'system' 
      }]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      setError('Erro ao limpar histórico');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Assistente de Agendamentos</h2>
        <button 
          className="clear-button" 
          onClick={handleClearChat}
          disabled={loading}
        >
          <FaTrash /> Limpar Conversa
        </button>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <FaRobot className="welcome-icon" />
            <h3>Bem-vindo ao Assistente de Agendamentos</h3>
            <p>Como posso ajudar você hoje?</p>
            <div className="example-commands">
              <p>Exemplos de comandos:</p>
              <ul>
                <li>"Agendar corte para João amanhã às 14h"</li>
                <li>"Ver agendamentos de amanhã"</li>
                <li>"Cancelar o agendamento de Maria"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-icon">
                {message.sender === 'user' ? <FaUser /> : <FaRobot />}
              </div>
              <div className="message-content">
                <p>{message.text}</p>
                {message.data && (
                  <div className="event-data">
                    <h4>Detalhes do Agendamento:</h4>
                    <p><strong>Cliente:</strong> {message.data.nomeCliente}</p>
                    <p><strong>Data/Hora:</strong> {new Date(message.data.dataHora).toLocaleString('pt-BR')}</p>
                    <p><strong>Serviço:</strong> {message.data.servico || 'Não especificado'}</p>
                  </div>
                )}
                {message.requiresConfirmation && (
                  <div className="confirmation-prompt">
                    <p>Por favor, confirme digitando "sim" ou "não".</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={loading}
          ref={inputRef}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="send-button"
        >
          {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
        </button>
      </form>
      
      <div className="voice-container">
        <p className="voice-label">Ou use o reconhecimento de voz</p>
        <VoiceInput onTranscript={handleVoiceTranscript} />
      </div>
    </div>
  );
};

export default ChatInterface; 