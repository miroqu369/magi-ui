const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;
const MAGI_SYS_URL = process.env.MAGI_SYS_URL || 'http://localhost:8081';
const MAGI_AC_URL = process.env.MAGI_AC_URL || 'http://localhost:8888';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// magi-ac プロキシ
app.all('/proxy/ac/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/proxy/ac', '');
    const url = MAGI_AC_URL + targetPath;
    console.log(`[Proxy] ${req.method} ${url}`);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// magi-sys プロキシ
app.all('/proxy/sys/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/proxy/sys', '');
    const url = MAGI_SYS_URL + targetPath;
    console.log(`[Proxy] ${req.method} ${url}`);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ MAGI-UI running on port ${PORT}`);
  console.log(`📡 Proxy: /proxy/ac/* -> ${MAGI_AC_URL}`);
  console.log(`📡 Proxy: /proxy/sys/* -> ${MAGI_SYS_URL}`);
});
