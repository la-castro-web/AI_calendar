import axios from 'axios';

console.log('[API Service] Configurando serviço de API');

// Criar instância do axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('[API Service] URL base configurada:', axiosInstance.defaults.baseURL);

// Interceptor para tratar erros
axiosInstance.interceptors.response.use(
  response => {
    console.log('[API Service] Resposta recebida:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('[API Service] Erro na requisição API:', error.message);
    console.error('[API Service] URL da requisição:', error.config?.url);
    console.error('[API Service] Método da requisição:', error.config?.method);
    console.error('[API Service] Resposta do servidor:', error.response?.data);
    return Promise.reject(error);
  }
);

// Serviço de API
const apiService = {
  // Métodos para comunicação com o backend
  post: (url, data) => {
    console.log(`[API Service] Enviando POST para ${url}`, data);
    return axiosInstance.post(url, data);
  },
  get: (url, params) => {
    console.log(`[API Service] Enviando GET para ${url}`, params);
    return axiosInstance.get(url, { params });
  },
  put: (url, data) => {
    console.log(`[API Service] Enviando PUT para ${url}`, data);
    return axiosInstance.put(url, data);
  },
  delete: (url) => {
    console.log(`[API Service] Enviando DELETE para ${url}`);
    return axiosInstance.delete(url);
  }
};

console.log('[API Service] Serviço de API configurado com sucesso');

export default apiService; 