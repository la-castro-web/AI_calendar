import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaUser, FaRobot, FaPaperPlane, FaMicrophone, FaTrash } from 'react-icons/fa';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Texto reconhecido:', transcript);
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Reconhecimento de voz não suportado neste navegador');
    }
  }, []);

  // Rolar para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      console.log('Enviando mensagem:', input);
      
      // Adicionar mensagem do usuário ao chat
      const userMessage = { text: input, sender: 'user', timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Limpar input
      setInput('');
      
      // Enviar para o backend
      const response = await api.post('/chat/message', { message: input });
      console.log('Resposta do servidor:', response.data);
      
      // Adicionar resposta do assistente ao chat
      if (response.data && response.data.message) {
        const botMessage = { 
          text: response.data.message, 
          sender: 'bot', 
          timestamp: new Date() 
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        console.error('Resposta do servidor não contém mensagem:', response.data);
        // Adicionar mensagem de erro
        const errorMessage = { 
          text: 'Desculpe, ocorreu um erro ao processar sua mensagem.', 
          sender: 'bot', 
          timestamp: new Date() 
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Adicionar mensagem de erro
      const errorMessage = { 
        text: 'Desculpe, ocorreu um erro ao enviar sua mensagem.', 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  // Função para iniciar/parar gravação de voz
  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  // Função para limpar o histórico de conversa
  const clearChat = () => {
    setMessages([]);
  };

  // Função para lidar com tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container" ref={chatContainerRef}>
      <div className="chat-header">
        <h2>Assistente de Agendamentos</h2>
        <button 
          className="clear-button" 
          onClick={clearChat}
          title="Limpar Conversa"
        >
          <FaTrash /> Limpar Conversa
        </button>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="welcome-message">
              <FaRobot className="welcome-icon" />
              <p>Olá! Como posso ajudar você hoje?</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-avatar">
                {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="message-input"
        />
        <button 
          className={`voice-button ${isRecording ? 'recording' : ''}`} 
          onClick={toggleRecording}
          disabled={!recognition}
          title={recognition ? 'Usar reconhecimento de voz' : 'Reconhecimento de voz não suportado'}
        >
          <FaMicrophone />
        </button>
        <button 
          className="send-button" 
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 