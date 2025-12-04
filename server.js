const express = require('express');
const path = require('path');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const app = express();
const PORT = process.env.PORT || 8080;

// Service URLs
const MAGI_SYS_URL = process.env.MAGI_SYS_URL || 'https://magi-app-398890937507.asia-northeast1.run.app';
const MAGI_AC_URL = process.env.MAGI_AC_URL || 'https://magi-ac-398890937507.asia-northeast1.run.app';
const MAGI_MCP_URL = process.env.MAGI_MCP_URL || 'https://magi-mcp-398890937507.asia-northeast1.run.app';

const auth = new GoogleAuth();

// MCP Session Cache
let mcpSessionId = null;
let mcpSessionExpiry = null;

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

async function getMcpSession() {
  if (mcpSessionId && mcpSessionExpiry && Date.now() < mcpSessionExpiry) {
    return mcpSessionId;
  }
  
  const token = await getIdToken(MAGI_MCP_URL);
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  
  const response = await axios({
    method: 'POST',
    url: MAGI_MCP_URL + '/mcp',
    data: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'magi-ui', version: '1.0.0' }
      }
    },
    headers,
    timeout: 30000
  });
  
  mcpSessionId = response.headers['mcp-session-id'];
  mcpSessionExpiry = Date.now() + 4 * 60 * 1000;
  console.log('[MCP] New session:', mcpSessionId);
  return mcpSessionId;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// MAGI-AC Proxy
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

// MAGI-SYS Proxy
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

// MCP Tool Call
app.post('/proxy/mcp/call', async (req, res) => {
  try {
    const { tool, arguments: args } = req.body;
    console.log('[MCP] Calling:', tool);
    
    const sessionId = await getMcpSession();
    const token = await getIdToken(MAGI_MCP_URL);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const response = await axios({
      method: 'POST',
      url: MAGI_MCP_URL + '/mcp',
      data: {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: tool, arguments: args || {} }
      },
      headers,
      timeout: 120000
    });
    
    const data = response.data;
    if (typeof data === 'string' && data.includes('event: message')) {
      const jsonMatch = data.match(/data: ({.*})/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        res.json(parsed.result || parsed);
        return;
      }
    }
    res.json(data);
  } catch (error) {
    console.log('[MCP Error]', error.message);
    mcpSessionId = null;
    res.status(500).json({ error: error.message });
  }
});

// MCP Tools List
app.get('/proxy/mcp/tools', async (req, res) => {
  try {
    const sessionId = await getMcpSession();
    const token = await getIdToken(MAGI_MCP_URL);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const response = await axios({
      method: 'POST',
      url: MAGI_MCP_URL + '/mcp',
      data: {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      },
      headers,
      timeout: 30000
    });
    
    const data = response.data;
    if (typeof data === 'string' && data.includes('event: message')) {
      const jsonMatch = data.match(/data: ({.*})/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        res.json(parsed.result || parsed);
        return;
      }
    }
    res.json(data);
  } catch (error) {
    console.log('[MCP Error]', error.message);
    mcpSessionId = null;
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
app.listen(PORT, () => console.log('MAGI-UI on ' + PORT));
