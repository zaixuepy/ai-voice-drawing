import { useState, useCallback, useRef, useEffect } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  // null=检测中, true=可用, false=不支持
  const [isSupported, setIsSupported] = useState(null);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const zhVoicesRef = useRef([]);
  const voiceIdxRef = useRef(0);
  const voicesLoadedRef = useRef(false);
  const primedRef = useRef(false);
  const onEndRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      console.warn('浏览器不支持 SpeechSynthesis API');
      setIsSupported(false);
      return;
    }

    // Chrome 的 speechSynthesis 有时会进入 paused 状态
    // 在初始化时 resume 一次
    try { window.speechSynthesis.resume(); } catch {}

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      voicesLoadedRef.current = true;
      const zh = voices.filter(v =>
        v.lang.startsWith('zh-CN') ||
        v.lang.startsWith('zh-TW') ||
        v.lang.startsWith('zh-HK') ||
        (v.lang.startsWith('zh') && v.localService)
      );
      if (zh.length > 0) {
        zhVoicesRef.current = zh;
        // 优先选择本地服务的高质量声音
        const prefIdx = zh.findIndex(v => v.localService && v.name.includes('Ting'));
        voiceIdxRef.current = prefIdx >= 0 ? prefIdx : 0;
        setVoiceIndex(voiceIdxRef.current);
      }
      setIsSupported(true);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    // Safari 兼容：1 秒后重试
    const timer = setTimeout(() => {
      if (!voicesLoadedRef.current) loadVoices();
      if (!voicesLoadedRef.current) {
        // 仍然无声音 → 标记为已检测但无中文声音
        setIsSupported(true); // API 可用，只是没有中文声音
      }
    }, 1000);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      clearTimeout(timer);
    };
  }, []);

  // 在用户手势期间调用，解锁 Chrome 的自动播放限制
  const prime = useCallback(() => {
    if (!window.speechSynthesis || primedRef.current) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      u.rate = 1.5;
      window.speechSynthesis.speak(u);
      primedRef.current = true;
    } catch {}
  }, []);

  const speak = useCallback((text) => {
    if (!text || !isEnabled || !window.speechSynthesis) return;

    // Chrome 有时会暂停 speechSynthesis，需先 resume
    try { window.speechSynthesis.resume(); } catch {}

    // 取消当前朗读
    window.speechSynthesis.cancel();

    // 确保声音已加载
    if (!voicesLoadedRef.current) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoadedRef.current = true;
        const zh = voices.filter(v => v.lang.startsWith('zh-CN') || v.lang.startsWith('zh-TW') || v.lang.startsWith('zh-HK'));
        if (zh.length > 0) zhVoicesRef.current = zh;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const currentVoice = zhVoicesRef.current[voiceIdxRef.current];
    if (currentVoice) {
      utterance.voice = currentVoice;
    }

    let endFired = false;
    let speakingStarted = false;
    const fireEnd = () => {
      if (endFired) return;
      endFired = true;
      clearInterval(pollTimer);
      setIsSpeaking(false);
      if (onEndRef.current) onEndRef.current();
    };

    utterance.onstart = () => { speakingStarted = true; setIsSpeaking(true); };
    utterance.onend = fireEnd;
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.warn('TTS 播放错误:', e.error);
      }
      fireEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Chrome 有时 speak 后不播放，需要手动 resume
    setTimeout(() => {
      try { window.speechSynthesis.resume(); } catch {}
    }, 50);

    // 兜底轮询：延迟 1s 后开始，每 500ms 检查
    // 解决 Chrome 中 utterance.onend 事件不触发的 bug
    const pollTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (endFired) { clearInterval(interval); return; }
        if (speakingStarted && !window.speechSynthesis.speaking) {
          fireEnd();
          clearInterval(interval);
        }
      }, 500);
    }, 1000);
  }, [isEnabled]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  const setOnEnd = useCallback((fn) => { onEndRef.current = fn; }, []);

  const switchVoice = useCallback(() => {
    if (zhVoicesRef.current.length === 0) return;
    const next = (voiceIdxRef.current + 1) % zhVoicesRef.current.length;
    voiceIdxRef.current = next;
    setVoiceIndex(next);
    // 预览新声音
    const v = zhVoicesRef.current[next];
    const u = new SpeechSynthesisUtterance(v.name);
    u.voice = v;
    u.volume = 0.6;
    u.rate = 1.1;
    try { window.speechSynthesis.cancel(); } catch {}
    window.speechSynthesis.speak(u);
    setTimeout(() => { try { window.speechSynthesis.resume(); } catch {} }, 50);
  }, []);

  return {
    isSpeaking, isEnabled, isSupported,
    speak, stop, toggleEnabled, prime,
    setOnEnd, switchVoice,
    voiceIndex, voiceCount: zhVoicesRef.current.length,
    currentVoiceName: zhVoicesRef.current[voiceIndex]?.name || '默认',
  };
}
