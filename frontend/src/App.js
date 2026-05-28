import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');`;

const styles = `
  ${FONTS}

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0a0a0f;
    color: #e8e6ff;
    min-height: 100vh;
  }

  .app-wrapper {
    min-height: 100vh;
    background: #0a0a0f;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 10%, rgba(99,60,220,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(180,80,220,0.12) 0%, transparent 60%);
    padding: 48px 20px 80px;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 56px;
  }
  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(99,60,220,0.15);
    border: 1px solid rgba(99,60,220,0.35);
    border-radius: 100px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a78bfa;
    margin-bottom: 20px;
  }
  .header h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 5vw, 58px);
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 14px;
  }
  .header h1 span {
    background: linear-gradient(90deg, #a78bfa, #e879f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .header p {
    font-size: 16px;
    color: rgba(232,230,255,0.5);
    font-weight: 300;
    max-width: 480px;
    margin: 0 auto;
  }

  /* Cards */
  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 28px;
    backdrop-filter: blur(12px);
    transition: border-color 0.3s;
  }
  .card:hover {
    border-color: rgba(167,139,250,0.2);
  }

  .card-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .card-title .step-badge {
    background: rgba(167,139,250,0.15);
    border: 1px solid rgba(167,139,250,0.3);
    border-radius: 8px;
    padding: 3px 10px;
    font-size: 11px;
    color: #a78bfa;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  @media (max-width: 700px) {
    .grid-2 { grid-template-columns: 1fr; }
  }

  /* Upload Zone */
  .upload-zone {
    border: 1.5px dashed rgba(167,139,250,0.3);
    border-radius: 14px;
    padding: 28px 20px;
    text-align: center;
    background: rgba(167,139,250,0.04);
    transition: all 0.3s;
    margin-bottom: 14px;
  }
  .upload-zone:hover {
    border-color: rgba(167,139,250,0.6);
    background: rgba(167,139,250,0.08);
  }

  .file-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .file-icon {
    width: 44px;
    height: 44px;
    background: rgba(167,139,250,0.12);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .file-label input { display: none; }
  .file-text-primary {
    font-size: 14px;
    font-weight: 500;
    color: #c4b5fd;
  }
  .file-text-secondary {
    font-size: 12px;
    color: rgba(232,230,255,0.35);
  }
  .remove-file-btn {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 100px;
    padding: 3px 12px;
    font-size: 11px;
    color: #fca5a5;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    margin-top: 6px;
  }
  .remove-file-btn:hover {
    background: rgba(239,68,68,0.2);
    border-color: rgba(239,68,68,0.4);
  }

  .file-name-pill {
    background: rgba(167,139,250,0.15);
    border: 1px solid rgba(167,139,250,0.3);
    border-radius: 100px;
    padding: 4px 14px;
    font-size: 12px;
    color: #a78bfa;
    font-weight: 500;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Buttons */
  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    border: none;
    padding: 13px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.25s;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d28d9, #9333ea);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(124,58,237,0.4);
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-ask {
    width: 100%;
    background: linear-gradient(135deg, #6d28d9, #c026d3);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-ask:hover:not(:disabled) {
    background: linear-gradient(135deg, #5b21b6, #a21caf);
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(109,40,217,0.45);
  }
  .btn-ask:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Status messages */
  .status-success {
    margin-top: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.25);
    color: #86efac;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .status-error {
    margin-top: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    color: #fca5a5;
    font-size: 13px;
  }

  .stats-box {
    margin-top: 12px;
    padding: 14px;
    background: rgba(167,139,250,0.07);
    border: 1px solid rgba(167,139,250,0.15);
    border-radius: 12px;
    display: flex;
    gap: 20px;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #a78bfa;
  }
  .stat-label {
    font-size: 11px;
    color: rgba(232,230,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Prompt Selector */
  .prompt-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(232,230,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
  }
  .prompt-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .prompt-btn {
    padding: 10px 8px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    color: rgba(232,230,255,0.5);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    font-family: 'DM Sans', sans-serif;
  }
  .prompt-btn.active {
    background: rgba(124,58,237,0.2);
    border-color: rgba(124,58,237,0.5);
    color: #c4b5fd;
  }
  .prompt-btn:hover:not(.active) {
    border-color: rgba(255,255,255,0.15);
    color: rgba(232,230,255,0.75);
  }
  .prompt-icon { font-size: 16px; margin-bottom: 3px; }
  .prompt-name { font-size: 12px; font-weight: 600; }
  .prompt-desc { font-size: 10px; opacity: 0.65; margin-top: 1px; }

  /* Textarea */
  .question-textarea {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #e8e6ff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    margin-bottom: 12px;
    resize: vertical;
    min-height: 80px;
    outline: none;
    transition: border-color 0.2s;
    line-height: 1.5;
  }
  .question-textarea::placeholder { color: rgba(232,230,255,0.25); }
  .question-textarea:focus { border-color: rgba(167,139,250,0.4); }

  .no-doc-hint {
    text-align: center;
    font-size: 12px;
    color: rgba(232,230,255,0.25);
    margin-top: 12px;
  }

  /* Answer */
  .answer-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(167,139,250,0.2);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 20px;
    animation: fadeUp 0.4s ease;
  }
  .answer-question-bubble {
    background: rgba(167,139,250,0.08);
    border: 1px solid rgba(167,139,250,0.18);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #c4b5fd;
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    line-height: 1.5;
  }
  .answer-question-bubble .q-label {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.06em;
    opacity: 0.6;
    text-transform: uppercase;
    flex-shrink: 0;
    padding-top: 1px;
  }
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #a78bfa;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .answer-dot {
    width: 7px;
    height: 7px;
    background: #a78bfa;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  .answer-body {
    font-size: 15px;
    line-height: 1.75;
    color: rgba(232,230,255,0.85);
    white-space: pre-wrap;
  }
  .answer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .meta-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(232,230,255,0.35);
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  /* Chat History */
  .history-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px;
  }
  .history-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .history-count {
    background: rgba(167,139,250,0.15);
    border-radius: 100px;
    padding: 2px 10px;
    font-size: 12px;
    color: #a78bfa;
    font-weight: 600;
  }
  .btn-clear-history {
    margin-left: auto;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(252,165,165,0.7);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .btn-clear-history:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.4);
    color: #fca5a5;
  }

  .history-item {
    padding: 16px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.025);
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }
  .history-item:hover { border-color: rgba(167,139,250,0.15); }
  .history-item:last-child { margin-bottom: 0; }

  .history-q {
    font-size: 13px;
    font-weight: 600;
    color: #c4b5fd;
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
  }
  .history-a {
    font-size: 13px;
    color: rgba(232,230,255,0.55);
    line-height: 1.6;
    margin-bottom: 10px;
    display: flex;
    gap: 8px;
  }
  .history-footer {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .history-tag {
    font-size: 10px;
    color: rgba(232,230,255,0.3);
    background: rgba(255,255,255,0.05);
    border-radius: 100px;
    padding: 3px 10px;
    letter-spacing: 0.04em;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const promptStyles = {
  zero_shot: { name: 'Zero-shot', icon: '⚡', desc: 'Direct & fast' },
  few_shot: { name: 'Few-shot', icon: '📝', desc: 'With examples' },
  chain_of_thought: { name: 'Chain-of-Thought', icon: '🧠', desc: 'Step-by-step' }
};

function App() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [question, setQuestion] = useState('');
  const [promptType, setPromptType] = useState('zero_shot');
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievedChunks, setRetrievedChunks] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected || null);
    setUploadStatus('');
    if (!selected) {
      setStats(null);
      setAnswer('');
      setChatHistory([]);
      setCurrentQuestion('');
    }
  };

  const handleUpload = async () => {
    if (!file) { setUploadStatus('Please select a file first'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.status === 'success') {
        setUploadStatus('success');
        setStats(response.data.stats);
        setChatHistory([]);
        setAnswer('');
        setCurrentQuestion('');
      } else {
        setUploadStatus('error:Upload failed');
      }
    } catch (error) {
      setUploadStatus(`error:${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const currentQuestion = question;
    setAnswer('');
    setCurrentQuestion(currentQuestion);
    setQuestion('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ask`, {
        question: currentQuestion,
        prompt_type: promptType,
        k: 8
      });
      const newAnswer = response.data.answer;
      setAnswer(newAnswer);
      setRetrievedChunks(response.data.retrieved_chunks);
      setChatHistory(prev => [
        { question: currentQuestion, answer: newAnswer, chunks: response.data.retrieved_chunks, promptType },
        ...prev
      ]);
    } catch (error) {
      setAnswer(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="app-wrapper">
        <div className="container">

          {/* Header */}
          <div className="header">
            <div className="header-badge">
              <span>●</span> RAG · FAISS · Groq
            </div>
            <h1>Ask Your <span>Documents</span></h1>
            <p>Upload any PDF and get instant, intelligent answers with multiple prompting strategies.</p>
          </div>

          {/* Grid */}
          <div className="grid-2">

            {/* Upload Card */}
            <div className="card">
              <div className="card-title">
                <span className="step-badge">Step 01</span>
                Upload Document
              </div>

              <div className="upload-zone">
                <label className="file-label">
                <div className="file-icon" style={{color:'#e5383b', fontSize:'15px', fontWeight:'600', fontFamily:'monospace', letterSpacing:'-1px'}}>PDF</div>
                  {file ? (
                    <>
                      <span className="file-name-pill">{file.name}</span>
                      <button className="remove-file-btn" onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setUploadStatus('');
                        setStats(null);
                        setAnswer('');
                        setChatHistory([]);
                        setCurrentQuestion('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}>✕ Remove</button>
                    </>
                  ) : (
                    <>
                      <span className="file-text-primary">Click to browse</span>
            <span className="file-text-secondary">PDF files only</span>
                    </>
                  )}
               <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} />
                </label>
              </div>

              <button className="btn-primary" onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? <><span className="spinner" /> Processing...</> : <><span>🚀</span> Upload & Index</>}
              </button>

              {uploadStatus === 'success' && (
                <div className="status-success">
                  <span>✓</span> {stats?.num_chunks} chunks indexed successfully
                </div>
              )}
              {uploadStatus.startsWith('error:') && (
                <div className="status-error">⚠ {uploadStatus.replace('error:', '')}</div>
              )}

              {stats && (
                <div className="stats-box">
                  <div className="stat-item">
                    <span className="stat-value">{stats.num_chunks}</span>
                    <span className="stat-label">Chunks</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.total_pages}</span>
                    <span className="stat-label">Pages</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ask Card */}
            <div className="card">
              <div className="card-title">
                <span className="step-badge">Step 02</span>
                Ask Questions
              </div>

              <div className="prompt-label">Prompting strategy</div>
              <div className="prompt-grid">
                {Object.entries(promptStyles).map(([key, s]) => (
                  <button
                    key={key}
                    className={`prompt-btn ${promptType === key ? 'active' : ''}`}
                    onClick={() => setPromptType(key)}
                  >
                    <div className="prompt-icon">{s.icon}</div>
                    <div className="prompt-name">{s.name}</div>
                    <div className="prompt-desc">{s.desc}</div>
                  </button>
                ))}
              </div>

              <textarea
                className="question-textarea"
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your document..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
                }}
              />

              <button
                className="btn-ask"
                onClick={handleAsk}
                disabled={loading || !question.trim() || !stats}
              >
                {loading ? <><span className="spinner" /> Thinking...</> : <><span>🔍</span> Ask Question</>}
              </button>

              {!stats && <p className="no-doc-hint">⚡ Upload a document first</p>}
            </div>
          </div>

          {/* Answer */}
          {(answer || loading) && (
            <div className="answer-card">
              <div className="answer-header">
                <div className="answer-dot" />
                Answer
              </div>
              {currentQuestion && (
                <div className="answer-question-bubble">
                  <span className="q-label">Q</span>
                  <span>{currentQuestion}</span>
                </div>
              )}
              {loading ? (
                <div style={{ color: 'rgba(232,230,255,0.35)', fontSize: 14 }}>Generating response...</div>
              ) : (
                <>
                  <div className="answer-body">{answer}</div>
                  <div className="answer-meta">
                    <span className="meta-pill">📚 {retrievedChunks} chunks retrieved</span>
                    <span className="meta-pill">{promptStyles[promptType]?.icon} {promptStyles[promptType]?.name}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="history-card">
              <div className="history-title">
                Chat History
                <span className="history-count">{chatHistory.length}</span>
                <button className="btn-clear-history" onClick={() => { setChatHistory([]); setAnswer(''); }}>
                  🗑 Clear all
                </button>
              </div>
              {chatHistory.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-q">
                    <span>🙋</span>
                    <span>{item.question}</span>
                  </div>
                  <div className="history-a">
                    <span>🤖</span>
                    <span>{item.answer.substring(0, 220)}{item.answer.length > 220 ? '…' : ''}</span>
                  </div>
                  <div className="history-footer">
                    <span className="history-tag">📚 {item.chunks} chunks</span>
                    <span className="history-tag">{promptStyles[item.promptType]?.icon} {promptStyles[item.promptType]?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;