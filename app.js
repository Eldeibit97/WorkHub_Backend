const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rutasCreacion = require('./src/routes/create.reservation.routes');
const reservationRoutes = require('./src/routes/reservation.routes');

const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:8000', 'http://localhost:8000'],
  credentials: true
}));
app.use(express.json());


app.use('/reservas', rutasCreacion);

app.use('/reservas/consulta', reservationRoutes);


app.get('/', (req, res) => {
  res.send('API WorkHub funcionando correctamente');
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});