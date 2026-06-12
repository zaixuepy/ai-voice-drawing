import ClarifyDialog from '../ClarifyDialog/ClarifyDialog';
import './ChatPanel.css';

export default function ChatPanel({ chatHistory, streamingText, isProcessing, onClarifySelect, onSpeak, isTTSEnabled, isSpeaking }) {
  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        对话记录
      </div>

      <div className="chat-messages">
        {chatHistory.length === 0 && !isProcessing && (
          <div style={{
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
            textAlign: 'center',
            marginTop: '40px',
            lineHeight: 1.8,
          }}>
            <div>试试对我说：</div>
            <div>"画一个红色的矩形"</div>
            <div>"在左边加一个蓝色圆形"</div>
            <div>"用箭头连接它们"</div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i}>
            <div
              className={`chat-message chat-message--${msg.role}`}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                maxWidth: '90%',
                lineHeight: 1.5,
                ...(msg.role === 'user'
                  ? {
                      alignSelf: 'flex-end',
                      background: 'var(--color-lavender-pale)',
                      border: '1.5px solid var(--color-lavender-border)',
                      color: 'var(--color-text)',
                      marginLeft: 'auto',
                    }
                  : {
                      alignSelf: 'flex-start',
                      background: 'var(--color-bg-warm)',
                      border: '1.5px solid var(--color-border-warm)',
                    }
                ),
              }}
            >
              {msg.text}
            </div>

            {msg.role === 'ai' && msg.text && !msg.result?.type === 'clarify' && (
              <button
                onClick={() => onSpeak?.(msg.text)}
                disabled={!isTTSEnabled || isSpeaking}
                title={isTTSEnabled ? '朗读此消息' : '语音播报已关闭'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                  marginLeft: 4,
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: isTTSEnabled ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                  border: `1px solid ${isTTSEnabled ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: isTTSEnabled ? 'var(--color-primary-pale)' : 'transparent',
                  cursor: isTTSEnabled ? 'pointer' : 'default',
                  transition: 'var(--transition-fast)',
                  opacity: isTTSEnabled ? 1 : 0.5,
                }}
              >
                {isSpeaking ? '🔊' : '🔈'} 朗读
              </button>
            )}

            {msg.result?.type === 'clarify' && msg === chatHistory[chatHistory.length - 1] && (
              <ClarifyDialog
                question={msg.result.question}
                options={msg.result.options}
                onSelect={onClarifySelect}
              />
            )}
          </div>
        ))}

        {isProcessing && (
          <div
            className="chat-message chat-message--ai"
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              maxWidth: '90%',
              alignSelf: 'flex-start',
              background: 'var(--color-bg-warm)',
              border: '1.5px solid var(--color-border-warm)',
              opacity: 0.8,
            }}
          >
            {streamingText ? (
              <>
                {streamingText}
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '14px',
                  background: 'var(--color-primary)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                }} />
              </>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                正在思考
                <span style={{ display: 'flex', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-tertiary)', animation: 'dot-bounce 1.4s ease-in-out infinite both', animationDelay: '0s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-tertiary)', animation: 'dot-bounce 1.4s ease-in-out infinite both', animationDelay: '0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-tertiary)', animation: 'dot-bounce 1.4s ease-in-out infinite both', animationDelay: '0.4s' }} />
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
