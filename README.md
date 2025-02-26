# Calendário Inteligente para Barbearias

Sistema de agendamento inteligente que utiliza processamento de linguagem natural para gerenciar compromissos em barbearias.

## Funcionalidades

- Processamento de comandos em linguagem natural
- Gerenciamento de agendamentos via IA
- Visualização de calendário em tempo real
- Sistema de chat para comandos

## Configuração

1. Clone o repositório
2. Configure as variáveis de ambiente (.env)
3. Execute `docker-compose up`

## Variáveis de Ambiente

- `MONGODB_URI`: URI do MongoDB
- `DEEPSEEK_API_KEY`: Chave da API do DeepSeek

## Estrutura de Pastas

AI_calendar/
│
├── backend/
│   ├── src/
│   │   ├── controllers/ (calendarController.js)
│   │   ├── routes/ (calendarRoutes.js)
│   │   ├── services/ (deepseekService.js, googleCalendarService.js)
│   │   ├── utils/ (authUtils.js)
│   │   ├── config/ (googleAuthConfig.js)
│   │   └── index.js
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ (CalendarView.jsx, ChatInterface.jsx)
│   │   ├── pages/ (Home.jsx)
│   │   ├── services/ (api.js)
│   │   ├── utils/ (parseResponse.js)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
│
├── docs/ (architecture.md)
├── .gitignore
├── docker-compose.yml
├── README.md
└── LICENSE
