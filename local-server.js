const express = require('express');
const si = require('systeminformation');
const speedTest = require('speedtest-net');
const { Pool } = require('pg');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/submit', async (req, res) => {
  const [systemData, speedData] = await Promise.all([collectSystemInformation(), performSpeedtest()]);
  saveToDatabase(systemData, speedData);
  res.json({ systemData, speedData });
});

const collectSystemInformation = async () => {
  const cpuData = await si.cpu();
  const baseboardData = await si.baseboard(); // Add this line
  const gpuData = await si.graphics();
  const ramData = await si.mem();

  const cpuModel = cpuData.brand;
  const motherboardVendor = baseboardData.manufacturer;
  const motherboardModel = baseboardData.model; // Update this line
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local server is running on port ${PORT}`));
