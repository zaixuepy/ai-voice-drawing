# Claude Code 指令（Step 1 + Step 3）

---

## STEP 1 指令：搭建完整骨架

你是一个全栈开发工程师，负责开发一款AI语音绘图工具的完整代码。

请严格按照以下技术规格文档实现项目。这是唯一开发依据。

---

### 项目技术栈

- 前端：React 18 + Vite
- 画布：@excalidraw/excalidraw（npm包）
- 语音：Web Speech API（浏览器原生）
- AI：Claude API（claude-sonnet-4-6），通过后端代理调用
- 后端：Node.js + Express
- 数据：SQLite（better-sqlite3）
- 部署目标：腾讯云容器（Docker）

---

### 文件结构（严格遵守，不得新增或删减顶层目录）

```
voicedraw/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceInput/
│   │   │   │   ├── VoiceInput.jsx
│   │   │   │   └── VoiceInput.css        ← 先留空，写注释"/* Manus负责填充 */"
│   │   │   ├── ChatPanel/
│   │   │   │   ├── ChatPanel.jsx
│   │   │   │   └── ChatPanel.css         ← 先留空
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.jsx
│   │   │   │   └── Canvas.css            ← 先留空
│   │   │   ├── FeedbackBar/
│   │   │   │   ├── FeedbackBar.jsx
│   │   │   │   └── FeedbackBar.css       ← 先留空
│   │   │   ├── ApiKeyConfig/
│   │   │   │   ├── ApiKeyConfig.jsx
│   │   │   │   └── ApiKeyConfig.css      ← 先留空
│   │   │   └── ClarifyDialog/
│   │   │       ├── ClarifyDialog.jsx
│   │   │       └── ClarifyDialog.css     ← 先留空
│   │   ├── hooks/
│   │   │   ├── useVoiceInput.js
│   │   │   ├── useCommandProcessor.js
│   │   │   └── useCanvasState.js
│   │   ├── services/
│   │   │   ├── claudeApi.js
│   │   │   └── analytics.js
│   │   ├── styles/
│   │   │   ├── design-tokens.css         ← 先用占位变量，Manus会覆盖
│   │   │   └── global.css
│   │   ├── utils/
│   │   │   ├── canvasSerializer.js
│   │   │   └── promptBuilder.js
│   │   └── App.jsx
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── chat.js
│   │   └── analytics.js
│   ├── db/
│   │   ├── init.sql
│   │   └── database.js
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

### 各模块实现要求

#### 1. 页面布局（App.jsx）
```
Header（Logo左 + ApiKeyConfig右上角齿轮图标）
├── 左侧 ChatPanel（宽度35%）
└── 右侧 Canvas（宽度65%）
底部 InputArea（麦克风按钮 + 文字输入框 + 发送按钮）
FeedbackBar（每次AI执行后出现在输入区上方）
```

#### 2. VoiceInput（useVoiceInput.js + VoiceInput.jsx）
- 使用 `window.SpeechRecognition || window.webkitSpeechRecognition`
- 语言设置 `lang: 'zh-CN'`
- `continuous: false`，`interimResults: true`
- 点击麦克风开始，再次点击或停顿1.5秒自动停止并触发发送
- 实时转写文字显示在输入框
- 降级策略：检测不到SpeechRecognition时，麦克风按钮`disabled`，显示提示"当前浏览器不支持语音输入，请使用文字输入"

#### 3. 指令解析层（useCommandProcessor.js）

核心流程：
```javascript
async function processCommand(userInput, canvasElements) {
  // 1. 检查是否是本地处理的简单指令（撤销/清空）
  // 2. 序列化画布状态
  // 3. 构建prompt
  // 4. 调用 POST /api/chat（streaming）
  // 5. 解析返回JSON
  // 6. 如果 type === 'clarify'，显示ClarifyDialog
  // 7. 如果 type === 'execute'，执行actions
  // 8. 埋点上报
}
```

本地处理的指令关键词（不调API）：
- 撤销：包含"撤销"/"退一步"/"不对"/"重来" → 触发 `history.undo()`
- 清空：包含"清空"/"全部删掉"/"清除画布" → 调用Excalidraw清空

#### 4. 画布状态序列化（canvasSerializer.js）

```javascript
// 输出格式：
// "画布元素：[id前12位:矩形@(x,y),颜色名,宽x高,label=文字] ..."
// 颜色映射：#FF4444→红色, #4A90D9→蓝色, #52C41A→绿色, 其他→保留hex值

export function serializeCanvas(elements) {
  if (!elements || elements.length === 0) return "画布为空";
  // ... 实现压缩序列化
}
```

#### 5. 系统Prompt（promptBuilder.js）

```javascript
export function buildSystemPrompt() {
  return `你是一个绘图指令解析器。你的唯一任务是将用户的自然语言指令转化为结构化的JSON操作指令。

## 输出格式
你必须只返回合法JSON，不包含任何其他文字、代码块标记或解释。

执行类型：
{"type":"execute","actions":[...],"confirmMessage":"用一句话告诉用户你做了什么"}

澄清类型：
{"type":"clarify","question":"用一句话问用户","options":["选项A","选项B","其他"]}

## Actions格式
- add_shape: {"type":"add_shape","shape":"rect|ellipse|text","x":100,"y":100,"width":120,"height":60,"backgroundColor":"#FF4444","strokeColor":"#000000","label":"文字","id":"自定义唯一id"}
- modify_shape: {"type":"modify_shape","targetId":"元素id","changes":{"backgroundColor":"#4A90D9","x":200}}
- delete_shape: {"type":"delete_shape","targetId":"元素id"}
- add_arrow: {"type":"add_arrow","fromId":"元素id","toId":"元素id","label":"可选文字"}
- clear_canvas: {"type":"clear_canvas"}

## 坐标规则
画布约1200x800。左边x:100-300，中间x:400-600，右边x:700-1000；上方y:100-250，中间y:300-500，下方y:550-700。
默认矩形120x60，默认圆形80x80。

## 上下文引用
"那个"/"它"/"刚才的" → 最近操作的元素；"左边的"/"右边的" → 按坐标匹配；"所有" → 批量操作。

## 颜色映射
红色→#FF4444, 蓝色→#4A90D9, 绿色→#52C41A, 黄色→#FADB14, 橙色→#FF7A00, 紫色→#7B5EA7, 黑色→#000000, 白色→#FFFFFF, 灰色→#8C8C8C

## 触发澄清的情况
- 纯评价性语言无明确方向（"感觉不好看"、"太乱了"）
- 目标元素有歧义（画布上有2个以上同类元素且未明确指定）
- 宁可澄清，不乱猜执行`;
}

export function buildUserMessage(canvasState, conversationHistory, userInput) {
  return `## 当前画布状态\n${canvasState}\n\n## 对话历史（最近5轮）\n${conversationHistory}\n\n## 用户指令\n${userInput}`;
}
```

#### 6. Excalidraw集成（Canvas.jsx + useCanvasState.js）

```javascript
// Canvas.jsx 核心结构
import { Excalidraw } from "@excalidraw/excalidraw";

// 需要暴露的ref方法供useCommandProcessor调用：
// - getElements(): 获取当前所有元素
// - addElement(elementData): 添加元素
// - updateElement(id, changes): 更新元素属性
// - deleteElement(id): 删除元素
// - clearCanvas(): 清空
// - undo(): 撤销
```

Actions执行器实现要点：
- `add_shape` → 构造Excalidraw元素对象，用 `updateScene` 添加
- `modify_shape` → 找到对应id元素，merge changes后 `updateScene`
- `add_arrow` → 构造arrow类型元素，设置 `startBinding` 和 `endBinding`
- 执行顺序：actions数组按顺序执行，每个执行后延迟50ms（避免状态竞争）

#### 7. 后端接口（backend/routes/chat.js）

```javascript
// POST /api/chat
// 从请求中取 userApiKey，优先用userApiKey，否则用 process.env.ANTHROPIC_API_KEY
// 透传streaming响应给前端
// 记录 token 消耗（从response headers或usage字段取）
```

#### 8. 埋点接口（backend/routes/analytics.js）

```javascript
// POST /api/analytics
// eventType === 'command': 插入command_logs，返回 { ok: true, id: insertedId }
// eventType === 'feedback': 插入feedback_logs，返回 { ok: true }

// GET /api/analytics/export
// 返回CSV格式，包含command_logs join feedback_logs的完整数据
```

数据库建表（backend/db/init.sql）：
```sql
CREATE TABLE IF NOT EXISTS command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_input TEXT,
  canvas_state TEXT,
  ai_output TEXT,
  latency_ms INTEGER,
  token_count INTEGER,
  is_clarify INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feedback_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  command_log_id INTEGER REFERENCES command_logs(id),
  feedback_type TEXT,
  user_input TEXT,
  ai_output TEXT
);
```

#### 9. ApiKeyConfig（ApiKeyConfig.jsx）
- 右上角齿轮图标，点击弹出modal
- 输入框输入API Key，保存到 `sessionStorage.setItem('userApiKey', value)`
- 已配置时显示"使用自定义 Key（sk-ant-...xxx）"，xxx为后6位
- 未配置时显示"使用默认 Key"
- 发起请求时从 `sessionStorage.getItem('userApiKey')` 取值传给后端

#### 10. FeedbackBar（FeedbackBar.jsx）
- 每次AI完成执行或澄清后显示
- 三个按钮：👍 非常棒 | 👌 还不错 | 👎 有待改进
- 点击后调用 `analytics.trackFeedback()`，然后隐藏FeedbackBar
- 需要接收 `commandLogId` prop（从埋点接口返回）

#### 11. ClarifyDialog（ClarifyDialog.jsx）
- 当AI返回 `type: 'clarify'` 时显示
- 展示 `question` 文字
- 将 `options` 数组渲染为选项按钮
- 用户点击某选项 → 将该选项文字作为下一轮用户输入直接触发processCommand

---

### Class命名规范（严格遵守，Manus将按此命名填充样式）

```
.voice-input-container / .voice-btn / .voice-btn--recording / .transcript-display
.chat-panel / .chat-message / .chat-message--user / .chat-message--ai
.canvas-container
.feedback-bar / .feedback-btn / .feedback-btn--great / .feedback-btn--good / .feedback-btn--bad
.api-key-modal / .api-key-input / .api-key-status
.clarify-dialog / .clarify-question / .clarify-options / .clarify-option-btn
.app-header / .app-layout / .input-area
```

---

### 开源引用规范
允许参考和借鉴开源项目，但：
1. 不直接复制完整文件
2. 所有借鉴需在README.md的`## 致谢`部分声明，格式：`- [项目名](URL) - 用于：xxx，许可证：MIT`
3. 代码重复率目标 < 30%

---

### Day 1 开发顺序（按此顺序，确保每步可运行）

1. 初始化项目（前端Vite+React，后端Express）
2. 嵌入Excalidraw，画布可正常显示和手动操作
3. 实现useVoiceInput.js，语音→文字显示在输入框
4. 后端 /api/chat 先mock返回固定JSON，验证前端解析流程
5. 实现canvasSerializer.js + promptBuilder.js
6. 接入真实Claude API，调通完整链路（streaming）
7. 实现基础actions：add_shape / modify_shape / add_arrow
8. 实现ApiKeyConfig.jsx
9. 实现FeedbackBar.jsx + 后端埋点接口 + SQLite建表
10. 端到端验证：说"画一个红色矩形" → 画布出现图形

**Day 1验收：能完整走通语音→AI解析→画布出现图形的全链路。**

---

## STEP 3 指令（Manus交付CSS后执行）

Manus已完成视觉设计，交付了以下文件：
- `design-tokens.css`
- 各组件CSS文件

请执行以下操作：

1. 将 `design-tokens.css` 复制到 `frontend/src/styles/design-tokens.css`，覆盖原有占位文件
2. 将各组件CSS文件内容合并到对应的组件CSS文件中
3. 检查所有class名称是否与代码中使用的一致，如有不匹配请修正（以代码中的命名为准）
4. 运行前端，检查样式是否正确渲染，修复任何布局破坏问题
5. 特别注意：不要修改任何 `.jsx` 或 `.js` 逻辑文件
