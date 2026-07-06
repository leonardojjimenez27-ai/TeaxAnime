// proxy-server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para AniList
app.post('/api/anilist', async (req, res) => {
   console.log('📡 Proxy recibiendo petición...');

   try {
      const response = await fetch('https://graphql.anilist.co', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'AnimeApp/1.0',
         },
         body: JSON.stringify(req.body),
      });

      const data = await response.json();
      console.log('✅ Respuesta recibida de AniList');
      res.json(data);
   } catch (error) {
      console.error('❌ Error en proxy:', error);
      res.status(500).json({
         error: 'Error en el proxy',
         message: error.message
      });
   }
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
   res.json({ status: 'ok', message: 'Proxy funcionando correctamente' });
});

app.listen(PORT, () => {
   console.log(`🔄 Proxy CORS corriendo en http://localhost:${PORT}`);
   console.log(`📡 Endpoint: http://localhost:${PORT}/api/anilist`);
});