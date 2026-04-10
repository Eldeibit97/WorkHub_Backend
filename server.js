const express = require('express');
const cors = require('cors');
const rutas = require('./src/routes/rutasCreacion');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 5500;

app.use(cors());
app.use(express.json());

app.use('/api', rutas)

app.get('/', (req, res) => {
  res.send('Server inicializado y api funcionando');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
