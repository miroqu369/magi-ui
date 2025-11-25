import React, { useState } from 'react';
import './App.css';

function App() {
  const [symbols, setSymbols] = useState(['AAPL', 'GOOGL', 'MSFT']);
  const [newSymbol, setNewSymbol] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const addSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const removeSymbol = (sym) => {
    setSymbols(symbols.filter(s => s !== sym));
    const newResults = { ...results };
    delete newResults[sym];
    setResults(newResults);
  };

  const analyzeSymbol = async (symbol) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8888/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, [symbol]: data }));
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      setResults(prev => ({
        ...prev,
        [symbol]: { error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const analyzeAll = async () => {
    setLoading(true);
    for (const symbol of symbols) {
      await analyzeSymbol(symbol);
    }
    setLoading(false);
  };

  const renderTechnicalData = (data) => {
    if (!data || !data.technical) {
      return <div className="no-data">データ取得中...</div>;
    }

    const tech = data.technical;
    return (
      <div className="technical-section">
        <h3>📊 テクニカル分析</h3>
        
        <div className="price-info">
          <div className="info-item">
            <span className="label">現在価格:</span>
            <span className="value">${tech.currentPrice}</span>
          </div>
          <div className="info-item">
            <span className="label">データソース:</span>
            <span className="value">{tech.dataSource}</span>
          </div>
        </div>

        {tech.indicators && (
          <div className="indicators">
            {/* RSI */}
            {tech.indicators.rsi && (
              <div className="indicator">
                <div className="indicator-name">RSI (14)</div>
                <div className="indicator-value">
                  <span className={`rsi-value ${tech.indicators.rsi > 70 ? 'overbought' : tech.indicators.rsi < 30 ? 'oversold' : 'neutral'}`}>
                    {tech.indicators.rsi}%
                  </span>
                </div>
                <div className="indicator-bar">
                  <div className="bar-background">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${tech.indicators.rsi}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* MACD */}
            {tech.indicators.macd && (
              <div className="indicator">
                <div className="indicator-name">MACD</div>
                <div className="macd-values">
                  <div className="macd-item">
                    <span>Line:</span>
                    <span className={tech.indicators.macd.line > 0 ? 'positive' : 'negative'}>
                      {tech.indicators.macd.line}
                    </span>
                  </div>
                  <div className="macd-item">
                    <span>Signal:</span>
                    <span className={tech.indicators.macd.signal > 0 ? 'positive' : 'negative'}>
                      {tech.indicators.macd.signal}
                    </span>
                  </div>
                  <div className="macd-item">
                    <span>Histogram:</span>
                    <span className={tech.indicators.macd.histogram > 0 ? 'positive' : 'negative'}>
                      {tech.indicators.macd.histogram}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bollinger Bands */}
            {tech.indicators.bollingerBands && (
              <div className="indicator">
                <div className="indicator-name">Bollinger Bands</div>
                <div className="bb-values">
                  <div className="bb-item">
                    <span>上限:</span>
                    <span className="bb-upper">${tech.indicators.bollingerBands.upper}</span>
                  </div>
                  <div className="bb-item">
                    <span>中央:</span>
                    <span className="bb-middle">${tech.indicators.bollingerBands.middle}</span>
                  </div>
                  <div className="bb-item">
                    <span>下限:</span>
                    <span className="bb-lower">${tech.indicators.bollingerBands.lower}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* シグナル */}
        {tech.signals && (
          <div className="signals">
            <h4>📈 シグナル</h4>
            <div className="signal-grid">
              {tech.signals.rsiSignal && (
                <div className={`signal-box ${tech.signals.rsiSignal.toLowerCase()}`}>
                  <span className="signal-label">RSI:</span>
                  <span className="signal-value">{tech.signals.rsiSignal}</span>
                </div>
              )}
              {tech.signals.macdSignal && (
                <div className={`signal-box ${tech.signals.macdSignal.toLowerCase()}`}>
                  <span className="signal-label">MACD:</span>
                  <span className="signal-value">{tech.signals.macdSignal}</span>
                </div>
              )}
              {tech.signals.bbSignal && (
                <div className={`signal-box ${tech.signals.bbSignal.toLowerCase()}`}>
                  <span className="signal-label">BB:</span>
                  <span className="signal-value">{tech.signals.bbSignal}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 MAGI System v4.0 - テクニカル分析</h1>
        <p>複数銘柄のリアルタイム株価分析</p>
      </header>

      <div className="control-panel">
        <div className="input-group">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="銘柄コード (例: AAPL, GOOGL)"
            onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
          />
          <button onClick={addSymbol} className="btn-add">追加</button>
          <button onClick={analyzeAll} className="btn-analyze" disabled={loading}>
            {loading ? '分析中...' : '全て分析'}
          </button>
        </div>

        <div className="symbol-list">
          {symbols.map(symbol => (
            <div key={symbol} className="symbol-tag">
              <span>{symbol}</span>
              <button 
                onClick={() => removeSymbol(symbol)}
                className="btn-remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="results-grid">
        {symbols.map(symbol => (
          <div key={symbol} className="result-card">
            <div className="card-header">
              <h2>{symbol}</h2>
              <button 
                onClick={() => analyzeSymbol(symbol)}
                className="btn-refresh"
                disabled={loading}
              >
                🔄 分析
              </button>
            </div>
            <div className="card-body">
              {results[symbol] ? (
                renderTechnicalData(results[symbol])
              ) : (
                <div className="empty-state">
                  <p>🔄 分析ボタンをクリックしてください</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
