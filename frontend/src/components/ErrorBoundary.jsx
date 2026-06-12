import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--vd-bg)', fontFamily: 'var(--vd-font-body)', padding: 24,
        }}>
          <div style={{
            background: 'var(--vd-bg-card)', border: '1.5px solid var(--vd-border)',
            borderRadius: 18, padding: 40, textAlign: 'center',
            boxShadow: 'var(--vd-shadow-sketch-lg)', maxWidth: 480, width: '100%',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: 'var(--vd-text-primary)',
              fontFamily: 'var(--vd-font-display)', marginBottom: 8,
            }}>页面出现错误</h2>
            <p style={{ fontSize: 13.5, color: 'var(--vd-text-secondary)', marginBottom: 12 }}>
              {this.state.error?.message || '发生了意外错误'}
            </p>
            <pre style={{
              fontSize: 11, color: 'var(--vd-text-tertiary)', background: 'var(--vd-bg-warm)',
              border: '1px solid var(--vd-border-warm)', borderRadius: 8, padding: 12,
              textAlign: 'left', marginBottom: 24, maxHeight: 120, overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: '1.5px solid var(--vd-primary)', background: 'var(--vd-primary)',
                color: '#fff', cursor: 'pointer', fontFamily: 'var(--vd-font-body)',
                boxShadow: 'var(--vd-shadow-sketch-sm)',
              }}
            >
              重新加载页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
