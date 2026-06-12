import { useState, useCallback, useRef } from 'react';

let _tabCounter = 0;
function genTabId() {
  _tabCounter += 1;
  return `tab_${Date.now()}_${_tabCounter}`;
}

function createTab(title = '新绘图') {
  return {
    id: genTabId(),
    title,
    chatHistory: [],
    canvasSnapshot: null,
    createdAt: Date.now(),
  };
}

export function useTabSessions() {
  const [tabs, setTabs] = useState(() => [createTab('新绘图')]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id);
  const saveCanvasRef = useRef(null);    // () => elements snapshot
  const restoreCanvasRef = useRef(null); // (elements) => void

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const setSaveCanvas = useCallback((fn) => { saveCanvasRef.current = fn; }, []);
  const setRestoreCanvas = useCallback((fn) => { restoreCanvasRef.current = fn; }, []);

  const switchTab = useCallback((tabId) => {
    if (tabId === activeTabId) return;

    // Save current canvas state
    const currentElements = saveCanvasRef.current?.();
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, canvasSnapshot: currentElements || t.canvasSnapshot } : t
    ));

    setActiveTabId(tabId);

    // Restore target tab's canvas
    const target = tabs.find(t => t.id === tabId);
    if (target?.canvasSnapshot) {
      setTimeout(() => restoreCanvasRef.current?.(target.canvasSnapshot), 80);
    } else if (target && !target.canvasSnapshot && target.chatHistory.length === 0) {
      setTimeout(() => restoreCanvasRef.current?.([]), 80);
    }
  }, [activeTabId, tabs]);

  const newTab = useCallback(() => {
    const currentElements = saveCanvasRef.current?.();
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, canvasSnapshot: currentElements || t.canvasSnapshot } : t
    ));

    const tab = createTab('新绘图');
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
    setTimeout(() => restoreCanvasRef.current?.([]), 80);
  }, [activeTabId]);

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(t => t.id !== tabId);
      if (tabId === activeTabId) {
        const idx = prev.findIndex(t => t.id === tabId);
        const next = filtered[Math.min(idx, filtered.length - 1)];
        setActiveTabId(next.id);
        const target = filtered.find(t => t.id === next.id);
        if (target?.canvasSnapshot) {
          setTimeout(() => restoreCanvasRef.current?.(target.canvasSnapshot), 80);
        }
      }
      return filtered;
    });
  }, [activeTabId]);

  const renameTab = useCallback((tabId, title) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t));
  }, []);

  const updateChatHistory = useCallback((tabId, chatHistory) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, chatHistory } : t));
  }, []);

  const updateCanvasSnapshot = useCallback((tabId) => {
    const elements = saveCanvasRef.current?.();
    if (elements) {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, canvasSnapshot: elements } : t));
    }
  }, []);

  // Auto-rename tab from first user message
  const autoTitle = useCallback((tabId, userInput) => {
    setTabs(prev => prev.map(t => {
      if (t.id === tabId && t.title === '新绘图') {
        return { ...t, title: userInput.slice(0, 20) + (userInput.length > 20 ? '…' : '') };
      }
      return t;
    }));
  }, []);

  return {
    tabs,
    activeTabId,
    activeTab,
    switchTab,
    newTab,
    closeTab,
    renameTab,
    updateChatHistory,
    updateCanvasSnapshot,
    autoTitle,
    setSaveCanvas,
    setRestoreCanvas,
  };
}
