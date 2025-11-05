import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

//Middleware
app.use(cors());
app.use(express.json());

//Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'El servidor esta corriendo' });
});

//Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocurrio un error!' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
