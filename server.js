const express = require('express');
const path = require('path');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 8080;
const MAGI_SYS_URL = process.env.MAGI_SYS_URL || 'https://magi-app-398890937507.asia-northeast1.run.app';
const MAGI_AC_URL = process.env.MAGI_AC_URL || 'https://magi-ac-398890937507.asia-northeast1.run.app';

const auth = new GoogleAuth();

async function getIdToken(targetUrl) {
  try {
    const client = await auth.getIdTokenClient(targetUrl);
    const token = await client.idTokenProvider.fetchIdToken(targetUrl);
    return token;
  } catch (e) {
    console.log('[Auth] Token error:', e.message);
    return null;
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

app.all('/proxy/ac/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/proxy/ac', '');
    const url = MAGI_AC_URL + targetPath;
    console.log('[Proxy] ' + req.method + ' ' + url);
    const token = await getIdToken(MAGI_AC_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const response = await axios({ method: req.method, url, data: req.body, headers, timeout: 120000 });
    res.json(response.data);
  } catch (error) {
    console.log('[Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.all('/proxy/sys/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/proxy/sys', '');
    const url = MAGI_SYS_URL + targetPath;
    console.log('[Proxy] ' + req.method + ' ' + url);
    const token = await getIdToken(MAGI_SYS_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const response = await axios({ method: req.method, url, data: req.body, headers, timeout: 120000 });
    res.json(response.data);
  } catch (error) {
    console.log('[Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
app.listen(PORT, () => console.log('MAGI-UI on ' + PORT));
