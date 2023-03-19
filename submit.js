const { collectSystemInformation, performSpeedtest, saveToDatabase } = require('./app');

const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  return await fn(req, res);
};

const handler = async (req, res) => {
  const [systemData, speedData] = await Promise.all([collectSystemInformation(), performSpeedtest()]);
  saveToDatabase(systemData, speedData);
  res.json({ systemData, speedData });
};

module.exports = allowCors(handler);
