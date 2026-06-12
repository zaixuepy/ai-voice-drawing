import { useState, useEffect, useRef } from 'react';
import './ApiKeyConfig.css';

export default function ApiKeyConfig({ onKeyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('userApiKey') || '';
    setSavedKey(stored);
    if (stored) {
      onKeyChange?.(stored);
    }
  }, [onKeyChange]);

  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  const handleSave = () => {
    const key = inputValue.trim();
    if (key) {
      sessionStorage.setItem('userApiKey', key);
      setSavedKey(key);
      onKeyChange?.(key);
    } else {
      sessionStorage.removeItem('userApiKey');
      setSavedKey('');
      onKeyChange?.('');
    }
    setIsOpen(false);
    setInputValue('');
  };

  const handleClear = () => {
    sessionStorage.removeItem('userApiKey');
    setSavedKey('');
    onKeyChange?.('');
    setIsOpen(false);
    setInputValue('');
  };

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length <= 11) return key.slice(0, 3) + '***';
    return key.slice(0, 11) + '...' + key.slice(-6);
  };

  return (
    <div className="api-key-config" ref={modalRef} style={{ position: 'relative' }}>
      <button
        className="api-key-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="API Key 设置"
        aria-label="API Key 设置"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'background var(--transition-fast)',
          background: isOpen ? 'var(--color-border)' : 'transparent',
        }}
      >
        ⚙️
      </button>

      <div className="api-key-status" style={{
        fontSize: '11px',
        color: savedKey ? 'var(--color-success)' : 'var(--color-text-secondary)',
        marginRight: '4px',
      }}>
        {savedKey ? `自定义 Key (${maskKey(savedKey)})` : '默认 Key'}
      </div>

      {isOpen && (
        <div className="api-key-modal" style={{
          position: 'absolute',
          top: '44px',
          right: '0',
          width: '320px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)',
          padding: '20px',
          zIndex: 1000,
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
            API Key 设置
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            留空则使用默认 Key。Key 仅在当前会话有效。
          </div>
          <input
            className="api-key-input"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={savedKey ? maskKey(savedKey) : 'sk-...'}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              outline: 'none',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsOpen(false);
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '8px',
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              保存
            </button>
            {savedKey && (
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  color: 'var(--color-recording)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  border: '1px solid var(--color-recording)',
                }}
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
