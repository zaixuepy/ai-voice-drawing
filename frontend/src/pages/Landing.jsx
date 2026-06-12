import { useLocation } from 'wouter';
import './Landing.css';

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CloudIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
);

const ILLUS = '/illustrations';

const features = [
  { icon: <MicIcon />, title: '语音驱动', desc: '告别打字和拖拽，用说话的方式表达想法，自动触发绘图。', color: 'var(--vd-primary)', bg: 'var(--vd-primary-pale)', border: 'var(--vd-primary-border)' },
  { icon: <SparkleIcon />, title: 'AI 理解', desc: '智能识别意图，自动生成结构化图形，支持流程图、架构图、思维导图。', color: 'var(--vd-orange)', bg: 'var(--vd-orange-pale)', border: '#F5DCA0' },
  { icon: <PencilIcon />, title: '自由编辑', desc: '在画布上自由调整、拖拽，完成你的创作，支持手动精调每个节点。', color: 'var(--vd-sage)', bg: 'var(--vd-sage-pale)', border: '#B8D8C0' },
  { icon: <CloudIcon />, title: '云端同步', desc: '自动保存你的作品，随时随地继续创作，支持导出 PNG / SVG。', color: 'var(--vd-teal)', bg: 'var(--vd-teal-pale)', border: '#A8DDD8' },
];

const examples = [
  { label: '流程图', img: `${ILLUS}/illus-agent-flow.png` },
  { label: '系统架构图', img: `${ILLUS}/illus-arch.png` },
  { label: '思维导图', img: `${ILLUS}/illus-mindmap.png` },
  { label: '用户旅程图', img: `${ILLUS}/illus-user-journey.png` },
];

const steps = [
  { num: '01', title: '说出想法', desc: '按住麦克风，用自然语言描述你想画的图' },
  { num: '02', title: 'AI 生成', desc: 'DeepSeek 理解语义，实时在画布上绘制图形' },
  { num: '03', title: '自由调整', desc: '直接在 Excalidraw 画布上拖拽、修改节点' },
  { num: '04', title: '导出分享', desc: '一键导出 PNG / SVG，或分享链接给团队' },
];

const aiStates = [
  { img: `${ILLUS}/illus-recording.png`, title: '语音识别', desc: '高精度中文语音识别，边说边看到实时转写' },
  { img: `${ILLUS}/illus-thinking.png`, title: 'AI 思考', desc: 'DeepSeek 模型理解意图，自动规划图形布局' },
  { img: `${ILLUS}/illus-feedback.png`, title: '即时反馈', desc: '几秒内完成绘制，不满意可随时调整重来' },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--vd-bg)', fontFamily: 'var(--vd-font-body)' }}>
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <a href="/" className="landing-nav__brand">
          <div className="landing-nav__logo"><MicIcon /></div>
          VoiceDraw
        </a>
        <div className="landing-nav__links">
          <a href="#features" className="landing-nav__link">功能</a>
          <a href="#examples" className="landing-nav__link">示例</a>
          <a href="#how" className="landing-nav__link">使用方法</a>
        </div>
        <div className="landing-nav__actions">
          <button className="btn-ghost" onClick={() => navigate('/app')}>查看示例</button>
          <button className="btn-primary" onClick={() => navigate('/app')}>
            <MicIcon /> 开始语音绘图
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-grid">
        <div>
          <span className="hero-badge">AI 语音绘图工具</span>
          <h1 className="hero-title">
            用语音，画出你的<em>想法</em>
          </h1>
          <p className="hero-desc">
            说出你的想法，AI 帮你生成图形。让灵感快速可视化，让复杂变得简单。
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-primary--lg" onClick={() => navigate('/app')}>
              <MicIcon /> 开始语音绘图
            </button>
            <button className="btn-ghost" onClick={() => navigate('/app')}>
              查看示例 <ArrowRightIcon />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: 'var(--vd-text-tertiary)' }}>
            {['免注册', '浏览器原生', '隐私优先'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckIcon /> {t}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-image-wrap">
          <img src={`${ILLUS}/illus-hero.png`} alt="VoiceDraw Hero" className="hero-image" />
          <div className="hero-float-badge" style={{ top: -12, right: 20 }}>
            <MicIcon /> 语音输入中...
          </div>
          <div className="hero-float-badge" style={{ bottom: 24, left: -16, animationDelay: '1.5s' }}>
            ✨ AI 生成中...
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section" style={{ textAlign: 'center' }}>
        <div className="section-label">核心功能</div>
        <h2 className="section-title" style={{ marginBottom: 10 }}>用<em>说话</em>的方式创作</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 48px' }}>
          不再需要学习复杂的绘图工具，直接说出你的想法，AI 帮你完成剩下的工作。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon" style={{ color: f.color, background: f.bg, borderColor: f.border }}>
                {f.icon}
              </div>
              <div className="feature-card__title">{f.title}</div>
              <div className="feature-card__desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="landing-section landing-section--alt">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="section-label">使用方法</div>
            <h2 className="section-title" style={{ marginBottom: 32 }}>四步，<em>搞定</em></h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {steps.map(s => (
                <div key={s.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--vd-primary-pale)', border: '1.5px solid var(--vd-primary-border)',
                    color: 'var(--vd-primary)', fontWeight: 700, fontSize: 13,
                    fontFamily: 'var(--vd-font-mono)',
                  }}>{s.num}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--vd-text-primary)', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--vd-text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={`${ILLUS}/illus-user-journey.png`}
              alt="使用流程"
              style={{ width: '100%', maxWidth: 400, borderRadius: 16, border: '2px solid var(--vd-border)', boxShadow: 'var(--vd-shadow-sketch-lg)' }}
            />
          </div>
        </div>
      </section>

      {/* ── Examples ── */}
      <section id="examples" className="landing-section" style={{ textAlign: 'center' }}>
        <div className="section-label">应用示例</div>
        <h2 className="section-title" style={{ marginBottom: 10 }}>画出<em>任何</em>图形</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 48px' }}>
          流程图、架构图、思维导图...说出你想要的，AI 即刻生成。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {examples.map(e => (
            <div key={e.label} className="example-card" onClick={() => navigate('/app')}>
              <img src={e.img} alt={e.label} className="example-card__img" />
              <div className="example-card__label">{e.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI States ── */}
      <section className="landing-section landing-section--alt" style={{ textAlign: 'center' }}>
        <div className="section-label">AI 状态展示</div>
        <h2 className="section-title" style={{ marginBottom: 10 }}>流畅的<em>交互体验</em></h2>
        <p className="section-subtitle" style={{ margin: '0 auto 48px' }}>
          从语音输入到图形生成，每个环节都有清晰的状态反馈。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {aiStates.map(s => (
            <div key={s.title} className="state-card">
              <img src={s.img} alt={s.title} className="state-card__img" />
              <div className="state-card__title">{s.title}</div>
              <div className="state-card__desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section" style={{ textAlign: 'center' }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>准备好开始了吗？</h2>
        <p style={{ fontSize: 16, color: 'var(--vd-text-secondary)', marginBottom: 28 }}>
          无需下载，免费使用，打开浏览器即可开始语音绘图。
        </p>
        <button className="btn-primary btn-primary--lg" onClick={() => navigate('/app')}>
          <MicIcon /> 免费开始使用
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <img src={`${ILLUS}/illus-landscape.png`} alt="" className="landing-footer__img" />
        <div className="landing-footer__text">VoiceDraw - AI 语音绘图工具</div>
      </footer>
    </div>
  );
}
