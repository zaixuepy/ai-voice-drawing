import { useState, useCallback } from 'react';
import { serializeCanvas } from '../utils/canvasSerializer';
import { buildSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import { callDeepSeekApi, parseAIResponse } from '../services/deepseekApi';
import { trackCommand } from '../services/analytics';

const LOCAL_COMMANDS = {
  undo: ['撤销', '退一步', '不对', '重来', '撤回', '取消'],
  clear: ['清空', '全部删掉', '清除画布'],
};

function detectLocalCommand(input) {
  const lower = input.toLowerCase();
  if (lower === 'ctrl+z') return 'undo';
  for (const kw of LOCAL_COMMANDS.undo) {
    if (input.includes(kw)) return 'undo';
  }
  for (const kw of LOCAL_COMMANDS.clear) {
    if (input.includes(kw)) return 'clear';
  }
  return null;
}

export function useCommandProcessor(sessionId, getElements, executeActions, undoCanvas, clearCanvas) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [streamingText, setStreamingText] = useState('');

  const processCommand = useCallback(async (userInput, userApiKey) => {
    setIsProcessing(true);
    setStreamingText('');
    const startTime = Date.now();

    try {
      const localCmd = detectLocalCommand(userInput);
      if (localCmd === 'undo') {
        undoCanvas();
        const result = { type: 'execute', confirmMessage: '已撤销上一步操作' };
        setLastResult(result);
        setChatHistory(prev => [
          ...prev.slice(-9),
          { role: 'user', text: userInput },
          { role: 'ai', text: '已撤销上一步操作', result },
        ]);
        setIsProcessing(false);
        return;
      }
      if (localCmd === 'clear') {
        clearCanvas();
        const result = { type: 'execute', confirmMessage: '已清空画布' };
        setLastResult(result);
        setChatHistory(prev => [
          ...prev.slice(-9),
          { role: 'user', text: userInput },
          { role: 'ai', text: '已清空画布', result },
        ]);
        setIsProcessing(false);
        return;
      }

      const canvasElements = getElements();
      const canvasState = serializeCanvas(canvasElements);
      const conversationHistory = chatHistory.slice(-10)
        .map(h => `${h.role === 'user' ? '用户' : 'AI'}: ${h.text}`)
        .join('\n');

      const systemPrompt = buildSystemPrompt();
      const userMessage = buildUserMessage(canvasState, conversationHistory, userInput);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      let rawResponse;
      let parsed;
      const MAX_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        rawResponse = await callDeepSeekApi(
          { messages, canvasState, userApiKey },
          (chunk, full) => setStreamingText(full)
        );

        try {
          parsed = parseAIResponse(rawResponse);
          break; // 成功则跳出
        } catch (parseErr) {
          console.error(`[parseAIResponse] 第${attempt + 1}次解析失败:`, parseErr.message);
          if (attempt < MAX_RETRIES) {
            messages.push({
              role: 'user',
              content: '请将合法的 JSON 对象放在 <output> 和 </output> 标签之间。注意：字符串内的双引号必须转义为 \\"，大括号必须配对。'
            });
            setStreamingText('');
          } else {
            throw parseErr; // 最后一次仍失败则抛出
          }
        }
      }
      const latencyMs = Date.now() - startTime;

      if (parsed.type === 'clarify') {
        setLastResult(parsed);
        setChatHistory(prev => [
          ...prev.slice(-9),
          { role: 'user', text: userInput },
          { role: 'ai', text: parsed.question, result: parsed },
        ]);
        trackCommand({
          sessionId, input: userInput, canvasState,
          output: JSON.stringify(parsed), latencyMs, isClarify: true,
        }).catch(() => {});
      } else if (parsed.type === 'execute') {
        await executeActions(parsed.actions);
        setLastResult(parsed);
        setChatHistory(prev => [
          ...prev.slice(-9),
          { role: 'user', text: userInput },
          { role: 'ai', text: parsed.confirmMessage || '操作完成', result: parsed },
        ]);
        const cmdId = await trackCommand({
          sessionId, input: userInput, canvasState,
          output: JSON.stringify(parsed), latencyMs, isClarify: false,
        });
        return { ...parsed, commandLogId: cmdId };
      }

      return parsed;
    } catch (err) {
      console.error('processCommand error:', err);
      const errorResult = {
        type: 'execute',
        confirmMessage: `出错了: ${err.message}`,
        error: true,
      };
      setLastResult(errorResult);
      setChatHistory(prev => [
        ...prev.slice(-9),
        { role: 'user', text: userInput },
        { role: 'ai', text: errorResult.confirmMessage, result: errorResult },
      ]);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, getElements, executeActions, undoCanvas, clearCanvas, chatHistory]);

  return {
    isProcessing,
    lastResult,
    chatHistory,
    streamingText,
    processCommand,
    setLastResult,
  };
}
