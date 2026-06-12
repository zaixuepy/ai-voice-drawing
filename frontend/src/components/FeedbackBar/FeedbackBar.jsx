import { useState } from 'react';
import { trackFeedback } from '../../services/analytics';
import './FeedbackBar.css';

export default function FeedbackBar({ sessionId, commandLogId, lastInput, lastOutput, visible }) {
  const [submitted, setSubmitted] = useState(false);

  if (!visible || !commandLogId || submitted) return null;

  const handleFeedback = async (type) => {
    await trackFeedback({
      sessionId,
      commandLogId,
      feedbackType: type,
      input: lastInput,
      output: lastOutput,
    });
    setSubmitted(true);
  };

  return (
    <div className="feedback-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      fontSize: '13px',
    }}>
      <span style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }}>
        这个操作怎么样？
      </span>
      <button
        className="feedback-btn feedback-btn--great"
        onClick={() => handleFeedback('great')}
        title="非常棒"
        style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: '#fff',
          transition: 'all var(--transition-fast)',
        }}
      >
        👍 非常棒
      </button>
      <button
        className="feedback-btn feedback-btn--good"
        onClick={() => handleFeedback('good')}
        title="还不错"
        style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: '#fff',
          transition: 'all var(--transition-fast)',
        }}
      >
        👌 还不错
      </button>
      <button
        className="feedback-btn feedback-btn--bad"
        onClick={() => handleFeedback('bad')}
        title="有待改进"
        style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: '#fff',
          transition: 'all var(--transition-fast)',
        }}
      >
        👎 有待改进
      </button>
    </div>
  );
}
