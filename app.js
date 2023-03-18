const express = require('express');
const si = require('systeminformation');
const speedTest = require('speedtest-net');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/submit', async (req, res) => {
  const [systemData, speedData] = await Promise.all([collectSystemInformation(), performSpeedtest()]);
  saveToDatabase(systemData, speedData);
  res.json({ systemData, speedData });
});

const collectSystemInformation = async () => {
  const cpuData = await si.cpu();
  const gpuData = await si.graphics();
  const ramData = await si.mem();

  const cpuModel = cpuData.brand;
  const motherboardVendor = cpuData.manufacturer;
  const motherboardModel = cpuData.virtualization;
  const gpuVendor = gpuData.controllers[0].vendor;
  const gpuModel = gpuData.controllers[0].model;
  const ram = (ramData.total / (1024 ** 3)).toFixed(2);

  return { cpuModel, motherboardVendor, motherboardModel, gpuVendor, gpuModel, ram };
};

const performSpeedtest = async () => {
  const options = { acceptLicense: true, acceptGdpr: true };
  const result = await speedTest(options);
  const downloadSpeed = (result.download.bandwidth / 125000).toFixed(2);
  const uploadSpeed = (result.upload.bandwidth / 125000).toFixed(2);

  return { downloadSpeed, uploadSpeed };
};

const saveToDatabase = async (systemData, speedData) => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const query = `INSERT INTO your_table_name (cpu, motherboard_vendor, motherboard_model, gpu_vendor, gpu_model, ram, download_speed, upload_speed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  const values = [systemData.cpuModel, systemData.motherboardVendor, systemData.motherboardModel, systemData.gpuVendor, systemData.gpuModel, systemData.ram, speedData.downloadSpeed, speedData.uploadSpeed];

  await pool.query(query, values);
  pool.end();
};

const PORT = process.env.PORT || 5432;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
