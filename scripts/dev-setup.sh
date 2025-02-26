#!/bin/bash

# Criar diretórios necessários
mkdir -p backend/src/{controllers,models,routes,services,utils}
mkdir -p frontend/src/{components,pages,services,styles}

# Copiar arquivos de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Instalar dependências
echo "Instalando dependências do backend..."
cd backend && npm install
cd ..

echo "Instalando dependências do frontend..."
cd frontend && npm install
cd ..

# Iniciar containers Docker
echo "Iniciando containers Docker..."
docker-compose up -d

echo "Ambiente de desenvolvimento configurado!" 