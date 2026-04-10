const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rutasCreacion = require('./src/routes/rutasCreacion');
const reservationRoutes = require('./src/routes/reservation.routes');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/reservas', rutasCreacion);

app.use('/reservas/consulta', reservationRoutes);


app.get('/', (req, res) => {
  res.send('API WorkHub funcionando correctamente');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});