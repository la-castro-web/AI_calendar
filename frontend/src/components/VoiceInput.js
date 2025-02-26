import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import './VoiceInput.css';

const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se o navegador suporta a API de reconhecimento de voz
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Seu navegador não suporta reconhecimento de voz. Tente usar o Chrome ou Edge.');
      return;
    }

    // Inicializar o objeto de reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // Configurar o reconhecimento
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'pt-BR'; // Definir idioma para português do Brasil
    
    // Manipulador de resultados
    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };
    
    // Manipulador de erros
    recognitionInstance.onerror = (event) => {
      console.error('Erro de reconhecimento de voz:', event.error);
      setError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
    };
    
    // Manipulador de fim
    recognitionInstance.onend = () => {
      if (isListening) {
        // Se ainda estiver no modo de escuta, reiniciar
        recognitionInstance.start();
      }
    };
    
    setRecognition(recognitionInstance);
    
    // Limpar ao desmontar
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setError(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmitTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
      setIsListening(false);
      recognition.stop();
    }
  };

  return (
    <div className="voice-input-container">
      {error && <div className="voice-error">{error}</div>}
      
      <div className="voice-controls">
        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={!recognition}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
        </button>
        
        {isListening && (
          <div className="listening-indicator">
            <div className="pulse"></div>
            <span>Ouvindo...</span>
          </div>
        )}
      </div>
      
      {transcript && (
        <div className="transcript-container">
          <p className="transcript-text">{transcript}</p>
          <button 
            className="send-transcript-button"
            onClick={handleSubmitTranscript}
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 