import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Fluxo de Caixa e Controle Financeiro Pessoal',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

// Serve Frontend static assets if dist exists
const possibleDists = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
];
const frontendDist = possibleDists.find(p => fs.existsSync(p)) || possibleDists[0];

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor backend rodando com sucesso na porta ${PORT}`);
  console.log(`📡 URL da API: http://localhost:${PORT}/api`);
  if (fs.existsSync(frontendDist)) {
    console.log(`💻 Aplicação Web acessível em: http://localhost:${PORT}`);
  }
});

