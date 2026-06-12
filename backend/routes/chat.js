const express = require('express');
const router = express.Router();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MODEL = 'deepseek-v4-flash';

router.post('/', async (req, res) => {
  const { messages, canvasState, userApiKey } = req.body;
  const apiKey = userApiKey || DEFAULT_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: '未配置 API Key，请在右上角设置' });
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(response.status).json({ error: `AI 服务返回错误: ${response.status}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n\n');
        }
      }
    }

    if (buffer) {
      res.write(buffer + '\n\n');
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat proxy error:', err);
    res.status(500).json({ error: 'AI 服务请求失败' });
  }
});

module.exports = router;
