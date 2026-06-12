import { useLocation } from 'wouter';
import './Landing.css';

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--vd-bg)', fontFamily: 'var(--vd-font-body)',
    }}>
      <div style={{
        background: 'var(--vd-bg-card)', border: '1.5px solid var(--vd-border)',
        borderRadius: 18, padding: '48px 40px', textAlign: 'center',
        boxShadow: 'var(--vd-shadow-sketch-lg), var(--vd-shadow-card)',
        maxWidth: 440, width: '100%',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 20px',
          background: 'var(--vd-danger-pale)', border: '1.5px solid var(--vd-danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--vd-danger)', fontSize: 28,
        }}>!</div>
        <h1 style={{
          fontSize: 48, fontWeight: 700, color: 'var(--vd-text-primary)',
          fontFamily: 'var(--vd-font-display)', letterSpacing: '-0.03em', marginBottom: 8,
        }}>404</h1>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--vd-text-primary)', marginBottom: 8 }}>
          页面未找到
        </h2>
        <p style={{ fontSize: 14, color: 'var(--vd-text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          您访问的页面不存在，可能已被移动或删除。
        </p>
        <button
          className="btn-primary"
          onClick={() => navigate('/')}
          style={{ fontSize: 14 }}
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
