import React, { useState } from 'react';
import './App.css';

function App() {
  const [symbols, setSymbols] = useState(['AAPL', 'GOOGL', 'MSFT']);
  const [newSymbol, setNewSymbol] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (symbol) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [symbol]: data }));
    } catch (err) {
      setResults(prev => ({ ...prev, [symbol]: { error: err.message } }));
    }
    setLoading(false);
  };

  const handleAddSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const handleAnalyzeAll = async () => {
    setLoading(true);
    for (const symbol of symbols) {
      await handleAnalyze(symbol);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>≡ MAGI System v4.0</h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '800px' }}>
        <h2>複数銘柄分析</h2>
        
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <input 
            value={newSymbol} 
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} 
            placeholder="銘柄を追加（例：TSLA）" 
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} 
          />
          <button 
            onClick={handleAddSymbol} 
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            追加
          </button>
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {symbols.map(symbol => (
            <div key={symbol} style={{ backgroundColor: '#f0f0f0', padding: '10px 15px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{symbol}</span>
              <button 
                onClick={() => setSymbols(symbols.filter(s => s !== symbol))}
                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '18px' }}>
                ×
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={handleAnalyzeAll} 
          disabled={loading} 
          style={{ padding: '10px 30px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }}>
          {loading ? '分析中...' : 'すべて分析'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {symbols.map(symbol => (
          <div key={symbol} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3>{symbol}</h3>
            <button 
              onClick={() => handleAnalyze(symbol)} 
              disabled={loading}
              style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', marginBottom: '15px' }}>
              分析
            </button>

            {results[symbol] && !results[symbol].error && (
              <div>
                <p><strong>企業:</strong> {results[symbol].company}</p>
                <p><strong>現在価格:</strong> ${results[symbol].financialData?.currentPrice?.toFixed(2) || 'N/A'}</p>
                <p><strong>推奨:</strong> 
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: results[symbol].consensus?.recommendation === 'BUY' ? 'green' : results[symbol].consensus?.recommendation === 'SELL' ? 'red' : 'orange' }}>
                    {results[symbol].consensus?.recommendation || 'N/A'}
                  </span>
                </p>
                <p><strong>信頼度:</strong> {(results[symbol].consensus?.average_confidence * 100).toFixed(0)}%</p>
                
                {results[symbol].aiRecommendations && (
                  <div style={{ marginTop: '15px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                    <p><strong>AI分析:</strong></p>
                    <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                      {results[symbol].aiRecommendations.map((rec, idx) => (
                        <li key={idx}>{rec.provider}: {rec.action} ({rec.confidence}%)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results[symbol]?.error && (
              <div style={{ backgroundColor: '#ffe6e6', padding: '15px', borderRadius: '4px', color: 'red' }}>
                エラー: {results[symbol].error}
              </div>
            )}

            {!results[symbol] && (
              <p style={{ color: '#999' }}>分析を実行してください</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
