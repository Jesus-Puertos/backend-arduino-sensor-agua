const express = require('express');
const mysql = require('mysql');
const { SerialPort } = require('serialport'); // Importa correctamente SerialPort
const Readline = require('@serialport/parser-readline');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración de conexión serial (ajusta el puerto a tu configuración)
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 }); 
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'agua_tinaco'
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado a la base de datos.');
});

// Lee datos del Arduino
parser.on('data', (nivel) => {
  const fecha = new Date().toISOString();
  console.log(`Nivel del agua: ${nivel} cm`);

  const query = 'INSERT INTO mediciones (nivel, fecha) VALUES (?, ?)';
  db.query(query, [nivel, fecha], (err) => {
    if (err) console.error('Error al guardar datos en la BD:', err);
  });
});

// Endpoint para consultar el nivel actual
app.get('/nivel-agua', (req, res) => {
  const query = 'SELECT * FROM mediciones ORDER BY fecha DESC LIMIT 1';
  db.query(query, (err, result) => {
    if (err) return res.status(500).send('Error al obtener datos');
    res.json(result[0]);
  });
});

// Endpoint para controlar la bomba
app.post('/control-bomba', (req, res) => {
  const { action } = req.body;
  if (action === 'off') {
    console.log("Bomba apagada.");
    // Aquí puedes añadir lógica para apagar la bomba si tienes un relé
    res.send("Bomba apagada.");
  } else {
    res.send("Acción no reconocida.");
  }
});

app.listen(4000, () => {
  console.log('Servidor ejecutándose en http://localhost:4000');
});