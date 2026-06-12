import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import Canvas from '../components/Canvas/Canvas';
import TabBar from '../components/TabBar/TabBar';
import ApiKeyConfig from '../components/ApiKeyConfig/ApiKeyConfig';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCommandProcessor } from '../hooks/useCommandProcessor';
import { useTTS } from '../hooks/useTTS';
import { useTabSessions } from '../hooks/useTabSessions';
import './AppPage.css';

/* ── Icons ── */
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
);
const CloseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const UndoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
  </svg>
);

/* ── Quick prompts ── */
const QUICK_PROMPTS = [
  '画一个红色的矩形',
  '画一个蓝色圆形在右边',
  '用箭头连接它们',
  '画一个流程图：开始→处理→结束',
];

/* ── Illustrations ── */
const ILLU = '/illustrations';
const AI_ICON = `${ILLU}/sketch-ai-icon.png`;
const EMPTY_IMG = `${ILLU}/illus-empty.png`;
const RECORDING_IMG = `${ILLU}/illus-recording.png`;
const THINKING_IMG = `${ILLU}/illus-thinking.png`;
const FEEDBACK_IMG = `${ILLU}/illus-feedback.png`;

/* ── Helpers ── */
function genId() { return Math.random().toString(36).slice(2, 9); }
function now() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function AppPage() {
  const [, navigate] = useLocation();
  const [textInput, setTextInput] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackCtx, setFeedbackCtx] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showApiModal, setShowApiModal] = useState(false);

  const canvasState = useCanvasState();
  const voiceInput = useVoiceInput();
  const tts = useTTS();
  const tabSessions = useTabSessions();
  const { activeTab, activeTabId } = tabSessions;

  const sessionIdRef = useRef('sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
  const pendingClarifyRef = useRef(null);

  // 统一的 speak 包装：标记 TTS 正在说话（防止回声），然后朗读
  const speakSafe = useCallback((text) => {
    if (!text) return;
    voiceInput.setTtsSpeaking(true);
    tts.speak(text);
  }, [voiceInput.setTtsSpeaking, tts.speak]);

  // 将语音文本匹配到 clarify 选项，支持：一/二/三/四、A/B/C/D、选项文本模糊匹配
  const matchClarifyOption = (text, options) => {
    if (!options) return null;
    const t = text.trim().replace(/[。！？，、\s]/g, '');
    const labels = ['一', '二', '三', '四'];
    for (let i = 0; i < options.length; i++) {
      const idxChars = [labels[i], String(i + 1), 'ABCD'[i], 'abcd'[i], `第${i + 1}`, `选项${labels[i]}`];
      if (idxChars.some(c => t === c || t.startsWith(c) || t.endsWith(c))) return options[i];
    }
    // 模糊匹配选项文本
    for (const opt of options) {
      const cleanOpt = opt.replace(/[。！？，、\s]/g, '');
      if (t === cleanOpt || cleanOpt.includes(t) || t.includes(cleanOpt.slice(0, 4))) return opt;
    }
    return null;
  };

  const commandProcessor = useCommandProcessor(
    sessionIdRef.current,
    canvasState.getElements,
    canvasState.executeActions,
    canvasState.undo,
    canvasState.clearCanvas
  );

  // Canvas save/restore on tab switch
  const savedElementsRef = useRef({});
  const lastTabRef = useRef(activeTabId);

  useEffect(() => {
    const prev = lastTabRef.current;
    if (prev !== activeTabId) {
      savedElementsRef.current[prev] = canvasState.getElements();
      const restore = savedElementsRef.current[activeTabId];
      if (restore !== undefined) {
        setTimeout(() => canvasState.restoreElements(restore), 100);
      } else if (activeTab.chatHistory.length === 0) {
        setTimeout(() => canvasState.restoreElements([]), 100);
      }
      lastTabRef.current = activeTabId;
    }
  }, [activeTabId]);

  const saveCurrentCanvas = useCallback(() => {
    savedElementsRef.current[activeTabId] = canvasState.getElements();
  }, [activeTabId, canvasState.getElements]);

  const addToast = useCallback((type, text) => {
    const id = genId();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || commandProcessor.isProcessing) return;
    setFeedbackVisible(false);
    setTextInput('');

    // 在用户手势期间解锁 TTS（Chrome 自动播放限制）
    tts.prime();

    if (activeTab.chatHistory.length === 0) {
      tabSessions.autoTitle(activeTabId, text.trim());
    }

    // 使用用户配置的 key，未配置则后端使用默认 key
    const apiKey = sessionStorage.getItem('userApiKey') || '';

    const result = await commandProcessor.processCommand(text, apiKey);

    if (result?.type === 'execute' && !result.error) {
      pendingClarifyRef.current = null;
      setFeedbackCtx({
        commandLogId: result.commandLogId,
        lastInput: text,
        lastOutput: result.confirmMessage || '',
      });
      setFeedbackVisible(true);
      speakSafe(result.confirmMessage || '');
      saveCurrentCanvas();
    } else if (result?.type === 'clarify') {
      pendingClarifyRef.current = result.options;
      const labels = ['一', '二', '三', '四'];
      const optionsText = result.options
        .map((opt, i) => `选项${labels[i] || i + 1}、${opt}`)
        .join('。');
      speakSafe(`${result.question}。${optionsText}`);
    } else {
      pendingClarifyRef.current = null;
    }
  }, [commandProcessor, tts, speakSafe, activeTabId, activeTab.chatHistory.length, tabSessions, saveCurrentCanvas, addToast]);

  const handleClarifySelect = useCallback(async (option) => {
    setFeedbackVisible(false);
    pendingClarifyRef.current = null;
    const apiKey = sessionStorage.getItem('userApiKey') || '';
    const result = await commandProcessor.processCommand(option, apiKey);
    if (result?.type === 'execute' && !result.error) {
      setFeedbackCtx({
        commandLogId: result.commandLogId,
        lastInput: option,
        lastOutput: result.confirmMessage || '',
      });
      setFeedbackVisible(true);
      speakSafe(result.confirmMessage || '');
      saveCurrentCanvas();
    } else if (result?.type === 'clarify') {
      pendingClarifyRef.current = result.options;
      const labels = ['一', '二', '三', '四'];
      const optionsText = result.options
        .map((opt, i) => `选项${labels[i] || i + 1}、${opt}`)
        .join('。');
      speakSafe(`${result.question}。${optionsText}`);
    }
  }, [commandProcessor, tts, speakSafe, activeTabId, tabSessions, saveCurrentCanvas]);

  // Voice input → 先尝试匹配 clarify 选项，匹配不到则作为新指令
  useEffect(() => {
    voiceInput.setOnResult((text) => {
      if (!text.trim()) return;
      const matched = matchClarifyOption(text, pendingClarifyRef.current);
      if (matched) {
        pendingClarifyRef.current = null;
        handleClarifySelect(matched);
      } else {
        handleSend(text);
      }
    });
  }, [voiceInput.setOnResult, handleSend, handleClarifySelect]);

  // 用户开始说话时，如果 TTS 正在播放则停止（打断 AI）
  useEffect(() => {
    voiceInput.setOnSpeechStart(() => {
      if (tts.isSpeaking) tts.stop();
    });
  }, [voiceInput.setOnSpeechStart, tts]);

  // TTS 结束/开始 → 同步状态给 voiceInput（用于过滤回声）
  useEffect(() => {
    tts.setOnEnd(() => {
      voiceInput.setTtsSpeaking(false);
    });
  }, [tts.setOnEnd, voiceInput.setTtsSpeaking]);

  // Sync chat history to active tab
  useEffect(() => {
    tabSessions.updateChatHistory(activeTabId, commandProcessor.chatHistory);
  }, [commandProcessor.chatHistory]);

  // Feedback auto-dismiss
  useEffect(() => {
    if (feedbackVisible) {
      const t = setTimeout(() => setFeedbackVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [feedbackVisible]);

  // Derived app state
  const chatHistory = commandProcessor.chatHistory;
  const isProcessing = commandProcessor.isProcessing;
  const isListening = voiceInput.isListening;
  const lastMsg = chatHistory[chatHistory.length - 1];
  const hasElements = canvasState.elements.length > 0;

  const getAppState = () => {
    // 画布有内容时，不显示录制覆盖层，只显示画布
    if (isListening && !hasElements && chatHistory.length === 0) return 'recording';
    if (isProcessing && !hasElements) return commandProcessor.streamingText ? 'drawing' : 'thinking';
    if (chatHistory.length > 0 || hasElements) return 'done';
    if (isListening) return 'recording'; // fallback: 空画布+监听中
    return 'empty';
  };
  const appState = getAppState();

  // Canvas overlay content
  const renderCanvasOverlay = () => {
    if (appState === 'empty') {
      return (
        <div className="canvas-empty-state">
          <img src={EMPTY_IMG} alt="空画布" className="canvas-empty-state__img" />
          <div className="canvas-empty-state__title">画布空空如也</div>
          <div className="canvas-empty-state__desc">在左侧输入框描述你想画的图，或点击下方示例</div>
          <div className="canvas-empty-state__prompts">
            {QUICK_PROMPTS.map(p => (
              <button key={p} className="canvas-quick-prompt" onClick={() => handleSend(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (appState === 'recording') {
      return (
        <div className="canvas-empty-state">
          <img src={RECORDING_IMG} alt="录音中" className="canvas-empty-state__img" style={{ width: 180, height: 180 }} />
          <div className="canvas-empty-state__title" style={{ color: '#FF6B6B' }}>正在聆听...</div>
          <div className="canvas-empty-state__desc" style={{ fontFamily: 'var(--vd-font-mono)', color: 'var(--vd-primary)', fontSize: 15, fontWeight: 500 }}>
            {voiceInput.interimText || voiceInput.transcript || '请开始说话'}
            <span className="cursor-blink">|</span>
          </div>
        </div>
      );
    }

    if (appState === 'thinking' || appState === 'drawing') {
      return (
        <div className="canvas-empty-state">
          <img src={THINKING_IMG} alt="思考中" className="canvas-empty-state__img" style={{ width: 180, height: 180 }} />
          <div className="canvas-empty-state__title">
            {appState === 'thinking' ? 'AI 正在理解...' : '正在绘制图形...'}
          </div>
          {appState === 'drawing' ? (
            <div className="canvas-progress-bar">
              <div className="canvas-progress-bar__fill" />
            </div>
          ) : (
            <div className="canvas-thinking-dots">
              <span /><span /><span />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header__brand">
          <button className="app-header__icon-btn" onClick={() => navigate('/')} title="返回首页">
            <ArrowLeftIcon />
          </button>
          <div className="app-header__logo-mark">
            <MicIcon size={13} />
          </div>
          <span className="app-header__name">VoiceDraw</span>
          <span className="app-header__beta">Beta</span>
        </div>

        <button className="app-header__title-btn">
          <span>{activeTab?.title || '新建图形'}</span>
        </button>

        <div className="app-header__actions">
          <button
            className={`app-header__tts-btn${tts.isEnabled ? ' app-header__tts-btn--active' : ''}`}
            onClick={tts.toggleEnabled}
            title={
              tts.isSupported === false ? '当前浏览器不支持语音播报' :
              tts.isEnabled ? '关闭语音播报' : '开启语音播报'
            }
            disabled={tts.isSupported === false}
            style={tts.isSupported === false ? { opacity: 0.35 } : {}}
          >
            {tts.isEnabled ? '🔊' : '🔇'}
          </button>
          <button
            className="app-header__icon-btn"
            onClick={() => setShowApiModal(true)}
            title="API Key 配置（可选）"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div className="app-tab-bar-wrap">
        <TabBar
          tabs={tabSessions.tabs}
          activeTabId={activeTabId}
          onSwitch={tabSessions.switchTab}
          onNew={tabSessions.newTab}
          onClose={tabSessions.closeTab}
          onRename={tabSessions.renameTab}
        />
      </div>

      {/* ── Workspace ── */}
      <div className="workspace">
        {/* ── Chat Column ── */}
        <div className="chat-col">
          <div className="chat-messages">
            {chatHistory.length === 0 && !isProcessing ? (
              <div className="chat-empty">
                <img src={EMPTY_IMG} alt="" className="chat-empty__img" />
                <div className="chat-empty__title">还没有对话</div>
                <div className="chat-empty__desc">试着说出你的想法，或点击右侧示例</div>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                    {msg.role === 'ai' && (
                      <div className="chat-msg__avatar">
                        <img src={AI_ICON} alt="AI" />
                      </div>
                    )}
                    <div className="chat-msg__body">
                      <div className="chat-msg__bubble">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ flex: 1 }}>{msg.text}</span>
                          {msg.role === 'ai' && msg.text && (
                            <button
                              className="chat-msg__speak-btn"
                              onClick={() => speakSafe(msg.text)}
                              disabled={!tts.isEnabled || tts.isSpeaking}
                              title="朗读"
                            >🔊</button>
                          )}
                        </div>
                      </div>
                      {msg.role === 'ai' && msg.text && (
                        <span className="chat-msg__time">{now()}</span>
                      )}
                      {msg.result?.type === 'clarify' && msg === lastMsg && (
                        <div className="chat-clarify-wrap" style={{ marginTop: 8 }}>
                          <div className="clarify-dialog">
                            <div className="clarify-dialog__ai-badge">
                              <div className="clarify-dialog__ai-icon">
                                <img src={AI_ICON} alt="AI" style={{ width: 16, height: 16, borderRadius: 4 }} />
                              </div>
                              <span className="clarify-dialog__ai-label">需要确认</span>
                            </div>
                            <div className="clarify-question">{msg.result.question}</div>
                            <div className="clarify-options">
                              {msg.result.options.map((opt, j) => (
                                <button
                                  key={j}
                                  className="clarify-option-btn"
                                  onClick={() => handleClarifySelect(opt)}
                                >
                                  <span className="clarify-option-btn__index">{String.fromCharCode(65 + j)}</span>
                                  <span className="clarify-option-btn__text">{opt}</span>
                                  <span className="clarify-option-btn__arrow"><ChevronRightIcon /></span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="chat-msg chat-msg--ai">
                    <div className="chat-msg__avatar">
                      <img src={AI_ICON} alt="AI" />
                    </div>
                    <div className="chat-msg__body">
                      <div className="chat-msg__bubble">
                        {commandProcessor.streamingText ? (
                          commandProcessor.streamingText.trim().startsWith('{') ? (
                            <>AI 正在思考...<span className="cursor-blink">|</span></>
                          ) : (
                            <>
                              {commandProcessor.streamingText}
                              <span className="cursor-blink">|</span>
                            </>
                          )
                        ) : (
                          <div className="chat-msg__dots">
                            <span /><span /><span />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback row */}
                {feedbackVisible && feedbackCtx.commandLogId && (
                  <div className="chat-feedback">
                    <img src={FEEDBACK_IMG} alt="" className="chat-feedback__icon" />
                    <span className="chat-feedback__label">对这次生成</span>
                    {[
                      { key: 'great', icon: '⭐', label: '非常棒' },
                      { key: 'good', icon: '👌', label: '还不错' },
                      { key: 'bad', icon: '🤔', label: '待改进' },
                    ].map(f => (
                      <button
                        key={f.key}
                        className={`feedback-btn feedback-btn--${f.key}`}
                        onClick={() => addToast('success', '感谢你的反馈！')}
                      >
                        <span className="feedback-btn__icon">{f.icon}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Input Bar ── */}
          <div className="chat-input-bar">
            <div className={`chat-input-wrap${isListening ? ' chat-input-wrap--recording' : ''}`}>
              <button
                className={`voice-btn${isListening ? ' voice-btn--recording' : ''}${voiceInput.isSupported === false ? ' voice-btn--disabled' : ''}`}
                onClick={voiceInput.isSupported ? voiceInput.toggleListening : undefined}
                disabled={voiceInput.isSupported !== true || isProcessing}
                title={
                  voiceInput.isSupported === null ? '正在检测语音功能...' :
                  voiceInput.isSupported === false ? (voiceInput.error || '当前浏览器不支持语音识别') :
                  isListening ? '停止录音' : '开始录音'
                }
                style={voiceInput.isSupported === false ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                <MicIcon />
              </button>
              {tts.voiceCount > 1 && (
                <button
                  className="voice-switch-btn"
                  onClick={tts.switchVoice}
                  title={`当前音色: ${tts.currentVoiceName}（点击切换）`}
                >
                  {tts.currentVoiceName.slice(0, 4)}
                </button>
              )}
              <div className="chat-input-divider" />
              {isListening ? (
                <div className="transcript-display">
                  {voiceInput.interimText || voiceInput.transcript || '正在聆听...'}
                  <span className="cursor-blink">|</span>
                </div>
              ) : (
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder="描述你想画的图形…"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                      e.preventDefault();
                      handleSend(textInput.trim());
                    }
                  }}
                  disabled={isProcessing || isListening}
                />
              )}
              {!isListening && (
                <button
                  className="send-btn"
                  onClick={() => { if (textInput.trim()) handleSend(textInput.trim()); }}
                  disabled={isProcessing || !textInput.trim()}
                >
                  <SendIcon />
                </button>
              )}
            </div>
            <div className="chat-input-hint">
              按 <kbd>Enter</kbd> 发送 · <kbd>Shift+Enter</kbd> 换行
            </div>
            {voiceInput.isSupported === false && voiceInput.error && (
              <div style={{
                marginTop: 6, fontSize: 11, color: 'var(--vd-danger)',
                textAlign: 'center', lineHeight: 1.4,
              }}>
                {voiceInput.error}
              </div>
            )}
            {voiceInput.isSupported === null && (
              <div style={{
                marginTop: 6, fontSize: 11, color: 'var(--vd-text-tertiary)',
                textAlign: 'center',
              }}>
                正在检测语音功能...
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="workspace-divider" />

        {/* ── Canvas Column ── */}
        <div className="canvas-col">
          {/* Toolbar */}
          <div className="canvas-top-bar">
            <div className="canvas-tool-group">
              <button className="canvas-tool-btn" title="撤销" onClick={canvasState.undo}>
                <UndoIcon />
              </button>
              <div className="canvas-tool-sep" />
              <button
                className="canvas-tool-btn"
                title="清空画布"
                onClick={() => {
                  canvasState.clearCanvas();
                  addToast('success', '画布已清空');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>

            {isProcessing && (
              <div className="canvas-generating-badge">
                <div className="canvas-generating-badge__spinner" />
                正在绘制...
              </div>
            )}
            {isListening && hasElements && (
              <div className="canvas-listening-badge">
                <div className="canvas-listening-badge__dot" />
                正在聆听...
              </div>
            )}
            <div />
          </div>

          {/* Canvas body */}
          <div className="canvas-body">
            <Canvas
              onExcalidrawAPIReady={canvasState.setExcalidrawAPI}
              onElementsChange={canvasState.refreshElements}
            />

            {/* State overlay */}
            {renderCanvasOverlay()}

            {/* Sync badge */}
            {appState === 'done' && (
              <div className="canvas-sync-badge">
                <div className="canvas-sync-badge__dot" />
                已同步
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New diagram FAB ── */}
      <button
        className="new-diagram-fab"
        title="新建图形"
        onClick={() => tabSessions.newTab()}
      >
        <PlusIcon />
      </button>

      {/* ── API Key Modal ── */}
      {showApiModal && (
        <div className="api-key-modal-backdrop" onClick={() => setShowApiModal(false)}>
          <div className="api-key-modal" onClick={e => e.stopPropagation()}>
            <div className="api-key-modal__header">
              <div className="api-key-modal__title-group">
                <div className="api-key-modal__icon"><SettingsIcon /></div>
                <div>
                  <div className="api-key-modal__title">API Key 设置</div>
                  <div className="api-key-modal__subtitle">可选，不填则使用默认 API Key</div>
                </div>
              </div>
              <button className="api-key-modal__close" onClick={() => setShowApiModal(false)}><CloseIcon /></button>
            </div>
            <div className="api-key-modal__body">
              <ApiKeyModalContent onClose={() => setShowApiModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Stack ── */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`toast__dot toast__dot--${t.type}`} />
              {t.text}
            </div>
            <button className="toast__close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── API Key Modal Inner ── */
function ApiKeyModalContent({ onClose }) {
  const [key, setKey] = useState(sessionStorage.getItem('userApiKey') || '');
  const [status, setStatus] = useState('idle');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    sessionStorage.setItem('userApiKey', key.trim());
    setStatus('valid');
    setTimeout(() => onClose(), 800);
  };

  return (
    <>
      <div className="api-key-modal__field">
        <label className="api-key-modal__label">API Key</label>
        <div style={{ position: 'relative' }}>
          <input
            className="api-key-input"
            type={showKey ? 'text' : 'password'}
            placeholder="sk-..."
            value={key}
            onChange={e => { setKey(e.target.value); setStatus('idle'); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ paddingRight: 40 }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vd-text-tertiary)',
              fontSize: 13,
            }}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
      </div>
      {status === 'valid' && (
        <div className="api-key-modal__footer" style={{ borderTop: 'none', padding: '8px 0 0' }}>
          <span style={{ fontSize: 12, color: 'var(--vd-success)', fontWeight: 500 }}>API Key 已保存</span>
        </div>
      )}
      <div className="api-key-modal__footer">
        <button className="api-key-modal__btn api-key-modal__btn--cancel" onClick={onClose}>取消</button>
        <button className="api-key-modal__btn api-key-modal__btn--save" onClick={handleSave}>保存</button>
      </div>
    </>
  );
}
