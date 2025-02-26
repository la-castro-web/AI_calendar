const mongoose = require('mongoose');

console.log('[Database] Iniciando conexão com MongoDB');

const connectDB = async () => {
  try {
    console.log('[Database] Tentando conectar ao MongoDB...');
    // Ajustando a URI para corresponder ao que vemos no MongoDB Compass
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barbershop';
    console.log(`[Database] URI de conexão: ${mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`[Database] MongoDB conectado com sucesso: ${conn.connection.host}`);
    
    // Listar as coleções disponíveis
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('[Database] Coleções disponíveis:', collections.map(c => c.name));
    
    return conn;
  } catch (error) {
    console.error('[Database] Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 