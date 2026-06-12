import { useEffect, useRef } from 'react';
import './VoiceInput.css';

export default function VoiceInput({
  isListening,
  transcript,
  interimText,
  isSupported,
  onToggle,
  setOnResult,
  onSend,
  textInput,
  onTextChange,
  disabled,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (setOnResult) {
      setOnResult((text) => {
        if (onSend) onSend(text);
      });
    }
  }, [setOnResult, onSend]);

  const displayText = isListening
    ? (interimText || transcript || '正在聆听...')
    : textInput;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
      e.preventDefault();
      onSend?.(textInput.trim());
    }
  };

  return (
    <div className="input-area" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {!isSupported && (
        <div style={{
          color: 'var(--color-warning)',
          fontSize: '12px',
          padding: '4px 8px',
          background: '#FFF7E6',
          borderRadius: 'var(--radius-sm)',
        }}>
          当前浏览器不支持语音输入，请使用文字输入
        </div>
      )}

      <button
        className={`voice-btn${isListening ? ' voice-btn--recording' : ''}`}
        onClick={onToggle}
        disabled={!isSupported || disabled}
        title={isListening ? '点击停止录音' : '点击开始录音'}
        aria-label={isListening ? '停止录音' : '开始录音'}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          background: isListening ? 'var(--color-recording)' : 'var(--color-bg)',
          border: `2px solid ${isListening ? 'var(--color-recording)' : 'var(--color-border)'}`,
          color: isListening ? '#fff' : 'var(--color-text)',
          transform: isListening ? 'scale(1.1)' : 'scale(1)',
          animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {isListening ? '⏹' : '🎤'}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={displayText}
        onChange={(e) => onTextChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isSupported ? '点击麦克风说话，或在此输入文字...' : '请输入文字指令...'}
        disabled={disabled || isListening}
        readOnly={isListening}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '15px',
          outline: 'none',
          background: isListening ? '#FFF3F3' : 'var(--color-surface)',
          transition: 'background 0.2s ease',
        }}
      />

      <button
        onClick={() => {
          if (textInput.trim()) {
            onSend?.(textInput.trim());
          }
        }}
        disabled={disabled || !textInput.trim() || isListening}
        style={{
          padding: '10px 20px',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: '14px',
          whiteSpace: 'nowrap',
          opacity: disabled || !textInput.trim() || isListening ? 0.5 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        发送
      </button>
    </div>
  );
}
