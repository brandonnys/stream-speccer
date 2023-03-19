const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.static('public'));
app.use(express.json()); // Add this line to parse incoming JSON data
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/submit', async (req, res) => { // Change this line to handle a POST request
  const data = req.body;
  const systemData = data.systemData;
  const speedData = data.speedData;
  await saveToDatabase(systemData, speedData);
  res.json({ systemData, speedData });
});

const saveToDatabase = async (systemData, speedData) => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const query = `INSERT INTO speccerdb (user_agent, platform, language, hardware_concurrency, download_speed) VALUES ($1, $2, $3, $4, $5)`;
  const values = [systemData.userAgent, systemData.platform, systemData.language, systemData.hardwareConcurrency, speedData.speed];

  await pool.query(query, values);
  pool.end();
};

const PORT = process.env.PORT || 5432;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
