export async function callDeepSeekApi({ messages, canvasState, userApiKey }, onChunk) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, canvasState, userApiKey }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || '请求失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          if (onChunk) onChunk(content, fullText);
        }
      } catch {
        // 跳过非JSON行
      }
    }
  }

  // 日志：方便排查 JSON 解析问题
  if (fullText.trim().startsWith('{')) {
    console.debug('[DeepSeek raw response]', fullText.slice(0, 300));
  }

  return fullText;
}

/**
 * 字符串感知的括号配对：从 startIdx 开始找到配对的 }
 * 会正确处理 JSON 字符串内的 {} 和转义字符
 */
function findMatchingBrace(str, startIdx) {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue; // 字符串内的 { } 不计数
    }

    if (ch === '"') { inString = true; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1; // 未找到配对
}

/**
 * 尝试从文本中提取并解析 JSON，支持多种回退策略
 */
function tryExtractJSON(text) {
  // 策略1: 字符串感知括号匹配（从第一个 { 开始）
  const start = text.indexOf('{');
  if (start !== -1) {
    const end = findMatchingBrace(text, start);
    if (end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }

  // 策略2: 尝试找最后一个 } 反向匹配
  const lastEnd = text.lastIndexOf('}');
  if (lastEnd !== -1) {
    // 从后往前找到配对的 {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = lastEnd; i >= 0; i--) {
      const ch = text[i];
      if (inString) {
        // 反向遍历时，\" 配对会不同，简化处理：找到首个 " 就切换
        if (ch === '"') {
          // 检查这个 " 是否被转义
          let bsCount = 0;
          for (let j = i - 1; j >= 0 && text[j] === '\\'; j--) bsCount++;
          if (bsCount % 2 === 0) inString = false;
        }
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '}') { depth++; continue; }
      if (ch === '{') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(text.slice(i, lastEnd + 1)); } catch {}
          break;
        }
      }
    }
  }

  // 策略3: 正则匹配所有 { ... } 对，逐个尝试解析
  const candidates = text.match(/\{(?:[^{}]|"[^"\\]*(?:\\.[^"\\]*)*")*\}/g) || [];
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch {}
  }

  // 策略4: 从 "type" 关键字附近搜索
  const typeMatch = text.match(/\{[^{}]*"type"\s*:\s*"(?:execute|clarify)"[^{}]*\}/);
  if (typeMatch) {
    try { return JSON.parse(typeMatch[0]); } catch {}
  }

  return null;
}

export function parseAIResponse(rawText) {
  // 优先从 <output> 标签中提取（新 prompt 格式）
  const outputMatch = rawText.match(/<output>\s*([\s\S]*?)\s*<\/output>/);
  let cleaned;
  if (outputMatch) {
    cleaned = outputMatch[1].trim();
  } else {
    // 回退：基础清洗去掉代码块
    cleaned = rawText.trim()
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```\s*$/, '')
      .trim();
  }

  // 尝试提取 JSON
  const result = tryExtractJSON(cleaned);

  if (!result) {
    // 失败时打日志方便调试
    console.error('[parseAIResponse] 无法提取 JSON，原始返回:', rawText.slice(0, 500));
    throw new Error('AI 返回内容不包含有效 JSON');
  }

  const parsed = result;

  if (!parsed.type || !['execute', 'clarify'].includes(parsed.type)) {
    throw new Error('AI 返回 JSON 缺少有效的 type 字段');
  }

  if (parsed.type === 'execute' && !Array.isArray(parsed.actions)) {
    throw new Error('execute 类型必须包含 actions 数组');
  }

  if (parsed.type === 'clarify') {
    if (!parsed.question) throw new Error('clarify 类型缺少 question');
    if (!Array.isArray(parsed.options) || parsed.options.length < 2) {
      throw new Error('clarify 类型 options 至少需要2个选项');
    }
  }

  return parsed;
}
