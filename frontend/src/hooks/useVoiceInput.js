import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // null=检测中, true=可用, false=不支持
  const [isSupported, setIsSupported] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const onResultRef = useRef(null);
  const onSpeechStartRef = useRef(null);
  const transcriptRef = useRef('');
  const interimRef = useRef('');
  const intentionalStopRef = useRef(false);
  const initializedRef = useRef(false);
  const ttsSpeakingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('浏览器不支持 SpeechRecognition API');
      setIsSupported(false);
      setError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }
    // 仅检测 API 可用性，不主动请求麦克风权限
    setIsSupported(true);
  }, []);

  function initRecognition(SpeechRecognition) {
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        // 检测到任何语音时先通知外层（用于中断 TTS）
        if (onSpeechStartRef.current) onSpeechStartRef.current();

        // TTS 正在播放时，只通知中断但不累积文本（避免回声）
        if (ttsSpeakingRef.current) return;

        let newFinal = '';
        let interim = '';

        // 只从 event.resultIndex 开始处理新结果，避免重复累积
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinal += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (newFinal) {
          transcriptRef.current += newFinal;
          setTranscript(transcriptRef.current);
        }
        interimRef.current = interim;
        setInterimText(interim);

        // 2 秒静默后处理当前文本（不停止识别）
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          deliverAndContinue();
        }, 2000);
      };

      recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error, event.message);
        if (event.error === 'not-allowed') {
          setError('麦克风权限被拒绝，请在浏览器设置中允许访问');
          setIsSupported(false);
        } else if (event.error === 'no-speech') {
          // 无语音，忽略
        } else if (event.error === 'aborted') {
          // 主动停止，忽略
        } else if (event.error === 'network') {
          setError('语音识别需要网络连接');
        } else {
          setError(`识别出错: ${event.error}`);
        }
        if (event.error !== 'aborted') setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        clearTimeout(silenceTimerRef.current);

        // 非手动停止 → 自动重启（实现全程开麦）
        if (!intentionalStopRef.current) {
          setTimeout(() => {
            if (!intentionalStopRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch {
                // 已经启动了则忽略
              }
            }
          }, 300);
        } else {
          // 手动停止时也要交付最后的文本
          const finalText = transcriptRef.current.trim() || interimRef.current.trim();
          if (finalText && onResultRef.current) {
            onResultRef.current(finalText);
          }
        }
        transcriptRef.current = '';
        interimRef.current = '';
        intentionalStopRef.current = false;
      };

      recognitionRef.current = recognition;
      initializedRef.current = true;
    } catch (e) {
      console.error('初始化语音识别失败:', e);
      setIsSupported(false);
      setError('初始化语音识别失败');
    }
  }

  // 处理当前转录文本（不停止识别），实现边说边处理
  const deliverAndContinue = useCallback(() => {
    const finalText = transcriptRef.current.trim() || interimRef.current.trim();
    if (finalText && onResultRef.current) {
      onResultRef.current(finalText);
    }
    transcriptRef.current = '';
    interimRef.current = '';
    setTranscript('');
    setInterimText('');
  }, []);

  // 首次点击时请求麦克风权限并初始化识别器
  const ensureInitialized = useCallback(async () => {
    if (initializedRef.current) return true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        initRecognition(SpeechRecognition);
        return true;
      } catch (err) {
        console.error('麦克风权限被拒绝:', err);
        if (err.name === 'NotAllowedError') {
          setError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
        } else if (err.name === 'NotFoundError') {
          setError('未检测到麦克风设备');
        } else {
          setError(`麦克风访问失败: ${err.message}`);
        }
        setIsSupported(false);
        return false;
      }
    } else {
      initRecognition(SpeechRecognition);
      return true;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!initializedRef.current) {
      const ok = await ensureInitialized();
      if (!ok) return;
    }
    if (!recognitionRef.current) {
      setError('语音识别未初始化，请刷新页面后重试');
      return;
    }
    setTranscript('');
    setInterimText('');
    transcriptRef.current = '';
    interimRef.current = '';
    setError(null);
    intentionalStopRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // 如果已经在监听中则忽略
      console.error('启动语音识别失败:', e);
    }
  }, [ensureInitialized]);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    intentionalStopRef.current = true;
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const setOnResult = useCallback((fn) => { onResultRef.current = fn; }, []);
  const setOnSpeechStart = useCallback((fn) => { onSpeechStartRef.current = fn; }, []);

  // 供外部设置 TTS 是否正在说话，用于过滤回声
  const setTtsSpeaking = useCallback((v) => { ttsSpeakingRef.current = v; }, []);

  return {
    isListening,
    transcript,
    interimText,
    isSupported,   // null=检测中, true=可用, false=不可用
    error,
    toggleListening,
    stopListening,
    startListening,
    setOnResult,
    setOnSpeechStart,
    setTtsSpeaking,
  };
}
