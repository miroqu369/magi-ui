const express = require('express');
const path = require('path');
const {GoogleAuth} = require('google-auth-library');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API エンドポイント
app.post('/api/query', async (req, res) => {
  const { prompt, mode } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'プロンプトが必要です' });
  }
  
  try {
    const magiAppUrl = 'https://magi-app-398890937507.asia-northeast1.run.app';
    
    // Identity Token を取得
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(magiAppUrl);
    
    const response = await client.request({
      url: `${magiAppUrl}/api/consensus`,
      method: 'POST',
      data: { 
        prompt, 
        meta: { mode: mode || 'consensus', temperature: 0.2 } 
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`));
