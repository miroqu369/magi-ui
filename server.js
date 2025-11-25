const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// build フォルダから静的ファイルを提供
app.use(express.static(path.join(__dirname, 'build')));

// ティッカーデータベース（モック）
const companies = {
  AAPL: { name: "Apple Inc.", recommendation: "BUY", confidence: 0.85 },
  GOOGL: { name: "Alphabet Inc.", recommendation: "BUY", confidence: 0.78 },
  MSFT: { name: "Microsoft Corporation", recommendation: "HOLD", confidence: 0.72 },
  AMZN: { name: "Amazon.com Inc.", recommendation: "BUY", confidence: 0.81 },
  TSLA: { name: "Tesla Inc.", recommendation: "HOLD", confidence: 0.65 },
  META: { name: "Meta Platforms Inc.", recommendation: "HOLD", confidence: 0.70 },
  NVDA: { name: "NVIDIA Corporation", recommendation: "BUY", confidence: 0.88 },
  JPY: { name: "ドル円（JPY）", recommendation: "HOLD", confidence: 0.60 }
};

// API エンドポイント
app.post('/api/analyze', (req, res) => {
  const { symbol } = req.body;
  const symbolUpper = symbol.toUpperCase();
  
  const company = companies[symbolUpper] || {
    name: `${symbolUpper} (Unknown)`,
    recommendation: "HOLD",
    confidence: 0.50
  };
  
  res.json({
    symbol: symbolUpper,
    company: company.name,
    consensus: { 
      recommendation: company.recommendation,
      confidence: company.confidence
    }
  });
});

// すべてのルートで index.html を返す
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
