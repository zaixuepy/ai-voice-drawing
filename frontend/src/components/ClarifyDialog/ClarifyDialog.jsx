import './ClarifyDialog.css';

export default function ClarifyDialog({ question, options, onSelect }) {
  if (!question || !options) return null;

  return (
    <div className="clarify-dialog" style={{
      marginTop: '8px',
      padding: '12px',
      background: '#FFF9F0',
      borderRadius: 'var(--radius-md)',
      border: '1px solid #FFD591',
    }}>
      <div className="clarify-question" style={{
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '8px',
        color: '#AD6800',
      }}>
        💡 {question}
      </div>
      <div className="clarify-options" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {options.map((option, i) => (
          <button
            key={i}
            className="clarify-option-btn"
            onClick={() => onSelect?.(option)}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.target.style.background = '#FFF1DB'}
            onMouseLeave={(e) => e.target.style.background = '#fff'}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
