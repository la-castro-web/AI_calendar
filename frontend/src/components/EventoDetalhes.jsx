import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './EventoDetalhes.css';

const EventoDetalhes = ({ event, isCreating, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    nomeCliente: '',
    dataHora: '',
    duracao: 30,
    servico: '',
    observacoes: ''
  });
  const [errors, setErrors] = useState({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (event) {
      // Se for um evento existente, formatar a data para o formato do input datetime-local
      if (event.dataHora) {
        const date = new Date(event.dataHora);
        const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
        
        setFormData({
          ...event,
          dataHora: formattedDate
        });
      } else {
        setFormData(event);
      }
    } else {
      // Se for um novo evento, usar valores padrão
      setFormData({
        nomeCliente: '',
        dataHora: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duracao: 30,
        servico: '',
        observacoes: ''
      });
    }
  }, [event]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nomeCliente.trim()) {
      newErrors.nomeCliente = 'Nome do cliente é obrigatório';
    }
    
    if (!formData.dataHora) {
      newErrors.dataHora = 'Data e hora são obrigatórias';
    }
    
    if (!formData.duracao || formData.duracao < 5) {
      newErrors.duracao = 'Duração mínima é de 5 minutos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleDelete = () => {
    if (isConfirmingDelete) {
      onDelete(event._id);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleCancel = () => {
    if (isConfirmingDelete) {
      setIsConfirmingDelete(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isCreating ? 'Novo Agendamento' : 'Detalhes do Agendamento'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nomeCliente">Nome do Cliente</label>
            <input
              type="text"
              id="nomeCliente"
              name="nomeCliente"
              value={formData.nomeCliente}
              onChange={handleChange}
              className={errors.nomeCliente ? 'error' : ''}
            />
            {errors.nomeCliente && <span className="error-message">{errors.nomeCliente}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="dataHora">Data e Hora</label>
            <input
              type="datetime-local"
              id="dataHora"
              name="dataHora"
              value={formData.dataHora}
              onChange={handleChange}
              className={errors.dataHora ? 'error' : ''}
            />
            {errors.dataHora && <span className="error-message">{errors.dataHora}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="duracao">Duração (minutos)</label>
            <input
              type="number"
              id="duracao"
              name="duracao"
              min="5"
              value={formData.duracao}
              onChange={handleChange}
              className={errors.duracao ? 'error' : ''}
            />
            {errors.duracao && <span className="error-message">{errors.duracao}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="servico">Serviço</label>
            <input
              type="text"
              id="servico"
              name="servico"
              value={formData.servico || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes || ''}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="button-group">
            <button type="submit" className="save-button">
              {isCreating ? 'Criar Agendamento' : 'Salvar Alterações'}
            </button>
            
            {!isCreating && (
              <button 
                type="button" 
                className="delete-btn"
                onClick={handleDelete}
              >
                {isConfirmingDelete ? 'Confirmar Exclusão' : 'Excluir Agendamento'}
              </button>
            )}
            
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventoDetalhes; 