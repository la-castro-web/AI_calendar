require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Adicionar morgan apenas se estiver disponível
try {
  const morgan = require('morgan');
  app.use(morgan('dev'));
  console.log('[Server] Morgan logger configurado');
} catch (error) {
  console.log('[Server] Morgan logger não disponível, continuando sem logging detalhado');
}

// Conectar ao banco de dados
console.log('[Server] Iniciando conexão com o banco de dados');
connectDB()
  .then(() => {
    console.log('[Server] Conexão com o banco de dados estabelecida');
    
    // Verificar a configuração da API Key do DeepSeek
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    console.log('[Server] DeepSeek API Key configurada:', deepseekApiKey ? 'Sim' : 'Não');
    
    // Configurar rotas
    console.log('[Server] Configurando rotas da API');
    app.use('/api', routes);
    console.log('[Server] Rotas da API configuradas');
    
    // Rota de teste
    app.get('/', (req, res) => {
      res.send('API do Calendário Inteligente está funcionando!');
    });
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`[Server] Servidor rodando na porta ${PORT}`);
      console.log(`[Server] API disponível em http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('[Server] Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
