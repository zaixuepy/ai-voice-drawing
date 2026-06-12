# 技术规格文档：AI 语音绘图工具
**版本：** v1.0 | **用途：** 交付 Claude Code 开发 | **日期：** 2026-06-12

> 本文档是开发唯一依据。所有平台（Claude Code / Kimi / Manus / WorkBuddy）均以此为准。

---

## 0. 多平台分工总览

| 平台 | 职责 | 交付物 | 合并方式 |
|------|------|--------|---------|
| **Claude Code** | 主力开发：项目骨架、所有业务逻辑、后端、API集成 | 完整可运行代码仓库 | 主分支 |
| **Manus** | UI视觉层：页面美化、样式、动效 | 独立CSS文件 + 静态HTML参考稿 | 只覆盖 `src/styles/` 目录 |
| **Kimi** | 辅助：Excalidraw API文档解读、系统prompt调试 | 文档片段、prompt草稿 | 人工合并 |
| **WorkBuddy** | 部署：腾讯云容器配置 | Dockerfile + 部署脚本 | 追加到根目录 |

**合并规则（重要）：**
- Manus **只能修改** `src/styles/` 下的文件，不得碰任何 `.jsx` / `.js` / `.ts` 逻辑文件
- Manus 交付物必须包含：`design-tokens.css`（颜色/字体变量）+ 各组件对应CSS文件
- 所有组件class命名由 Claude Code 先定义，Manus 按命名填充样式，不得新增或删除class

---

## 1. 项目概述

**一句话：** 用说话代替鼠标，把脑子里的图画出来。

用户通过语音（或文字降级）控制 Excalidraw 画布，AI 理解自然语言意图并转化为画布操作。核心差异化是**意图理解**：上下文引用、模糊指令容错、主动确认机制。

---

## 2. 技术栈

```
前端：React 18 + Vite
画布：@excalidraw/excalidraw（npm包）
语音：Web Speech API（浏览器原生，降级为文字输入）
AI：Claude API（claude-sonnet-4-6），通过后端代理
后端：Node.js + Express
数据：SQLite（better-sqlite3）
部署：腾讯云容器（Docker）
```

**禁止引入的依赖：**
- 任何 Agent 框架（LangChain / AutoGen 等）
- 付费 STT 服务（Whisper API 仅作应急备案）
- 任何 UI 组件库（Ant Design / MUI 等）—— 样式全部自写，交给 Manus

---

## 3. 文件结构（Claude Code 必须严格遵守）

```
voicedraw/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceInput/
│   │   │   │   ├── VoiceInput.jsx       # 麦克风按钮 + 实时转写显示
│   │   │   │   └── VoiceInput.css       # [Manus负责填充]
│   │   │   ├── ChatPanel/
│   │   │   │   ├── ChatPanel.jsx        # 左侧对话区：历史记录 + AI回应
│   │   │   │   └── ChatPanel.css        # [Manus负责填充]
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.jsx           # Excalidraw嵌入容器
│   │   │   │   └── Canvas.css           # [Manus负责填充]
│   │   │   ├── FeedbackBar/
│   │   │   │   ├── FeedbackBar.jsx      # 点赞/点踩埋点组件
│   │   │   │   └── FeedbackBar.css      # [Manus负责填充]
│   │   │   ├── ApiKeyConfig/
│   │   │   │   ├── ApiKeyConfig.jsx     # 用户自配API Key入口
│   │   │   │   └── ApiKeyConfig.css     # [Manus负责填充]
│   │   │   └── ClarifyDialog/
│   │   │       ├── ClarifyDialog.jsx    # 模糊指令反问对话框
│   │   │       └── ClarifyDialog.css   # [Manus负责填充]
│   │   ├── hooks/
│   │   │   ├── useVoiceInput.js         # Web Speech API逻辑
│   │   │   ├── useCommandProcessor.js   # 指令解析层核心Hook
│   │   │   └── useCanvasState.js        # 画布状态管理
│   │   ├── services/
│   │   │   ├── claudeApi.js             # Claude API调用封装
│   │   │   └── analytics.js            # 埋点上报封装
│   │   ├── styles/
│   │   │   ├── design-tokens.css        # [Manus定义颜色/字体变量]
│   │   │   └── global.css              # 全局reset
│   │   ├── utils/
│   │   │   ├── canvasSerializer.js      # 画布状态压缩序列化
│   │   │   └── promptBuilder.js        # 系统prompt构建
│   │   └── App.jsx
├── backend/
│   ├── server.js                        # Express主文件
│   ├── routes/
│   │   ├── chat.js                      # POST /api/chat（代理Claude API）
│   │   └── analytics.js                 # POST /api/analytics（埋点存储）
│   ├── db/
│   │   ├── init.sql                     # 建表语句
│   │   └── database.js                  # SQLite连接封装
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 4. 后端规格

### 4.1 接口列表

#### `POST /api/chat`
代理 Claude API，隐藏 API Key。

**Request：**
```json
{
  "messages": [...],          // 对话历史（最近5轮）
  "canvasState": "...",       // 画布状态压缩字符串
  "userApiKey": "sk-..."      // 可选，用户自配key；为空则用环境变量
}
```

**Response：** 透传 Claude API 的 streaming 响应。

#### `POST /api/analytics`
存储埋点数据。

**Request：**
```json
{
  "sessionId": "uuid",
  "eventType": "feedback" | "command",
  "data": {
    "input": "用户说的话",
    "output": "AI返回的JSON",
    "feedback": "great" | "good" | "bad",   // 仅feedback事件
    "latencyMs": 1200,
    "tokenCount": 450
  }
}
```

**Response：** `{ "ok": true }`

#### `GET /api/analytics/export`
导出所有埋点数据（CSV），用于赛后归因分析。

---

### 4.2 数据库表结构

```sql
-- 指令日志
CREATE TABLE command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_input TEXT,           -- 用户原始语音文字
  canvas_state TEXT,         -- 压缩后的画布状态
  ai_output TEXT,            -- Claude返回的完整JSON
  latency_ms INTEGER,
  token_count INTEGER,
  is_clarify INTEGER DEFAULT 0  -- 1=触发了反问
);

-- 态度反馈
CREATE TABLE feedback_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  command_log_id INTEGER REFERENCES command_logs(id),
  feedback_type TEXT,        -- 'great'(非常棒) | 'good'(还不错) | 'bad'(有待改进)
  user_input TEXT,           -- 冗余存储方便归因
  ai_output TEXT
);
```

---

## 5. 前端规格

### 5.1 页面布局

```
┌─────────────────────────────────────────────────┐
│  Header: Logo + API Key配置入口（右上角齿轮图标）   │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│   ChatPanel      │      Canvas                  │
│   （左侧 35%）    │      （右侧 65%）             │
│                  │                              │
│  - 对话历史       │   Excalidraw 嵌入            │
│  - AI回应         │                              │
│  - 澄清问题选项   │                              │
│                  │                              │
├──────────────────┴──────────────────────────────┤
│  底部输入区：[麦克风按钮] [文字输入框] [发送]      │
│  FeedbackBar：上次操作的点赞/点踩                  │
└─────────────────────────────────────────────────┘
```

### 5.2 组件规格

#### `VoiceInput.jsx`
- 麦克风按钮：点击开始录音，再次点击停止
- 录音中实时显示转写文字（显示在文字输入框内）
- 停顿超过 1.5 秒自动停止并触发发送
- 降级策略：检测到 `window.SpeechRecognition` 不存在时，麦克风按钮变为禁用状态，只保留文字输入框，并显示提示"当前浏览器不支持语音输入，请使用文字"
- 语言设置：`zh-CN`，可备选 `en-US`

#### `ChatPanel.jsx`
- 显示对话历史，用户输入（右对齐）和 AI 回应（左对齐）
- AI 回应分两种类型：
  - 执行确认："好的，已在左上角添加一个红色矩形"
  - 澄清问题：显示 `ClarifyDialog` 组件（选项卡模式）

#### `ClarifyDialog.jsx`
- 当 AI 返回 `clarify` 类型时弹出
- 以**选项卡形式**展示 2-3 个选项（不是文字气泡）
- 用户点击选项后，该选项作为下一轮输入直接发送
- 示例：
  ```
  AI: 您是想...
  [元素太密集，需要整理间距]  [颜色太相近，需要区分]  [其他]
  ```

#### `FeedbackBar.jsx`
- 每次 AI 执行操作后显示，位于底部输入区上方
- 三个按钮：👍 非常棒 | 👌 还不错 | 👎 有待改进
- 点击后调用 `analytics.js` 上报，然后隐藏
- 数据包含：当前 command_log_id + feedback_type

#### `ApiKeyConfig.jsx`
- 右上角齿轮图标，点击展开弹窗
- 输入框：填写 `sk-ant-...` 格式的 Claude API Key
- 存储：`sessionStorage.setItem('userApiKey', value)`（刷新即清除）
- 展示状态：已配置时显示"使用自定义 Key（sk-ant-...xxx）"
- 未配置时显示"使用默认 Key"，不阻塞使用

---

## 6. 指令解析层规格（核心）

### 6.1 数据流

```
useVoiceInput (文字)
    ↓
useCommandProcessor
    ├── buildPrompt()          构建系统prompt + 画布状态 + 对话历史
    ├── callClaudeApi()        POST /api/chat，streaming接收
    ├── parseActions()         解析返回JSON
    └── executeActions()       调用 Excalidraw API 执行
         ↓
useCanvasState (画布更新)
```

### 6.2 系统 Prompt 结构

```
你是一个绘图指令解析器。你的唯一任务是将用户的自然语言指令转化为结构化的JSON操作指令。

## 当前画布状态
{canvasState}

## 对话历史（最近5轮）
{conversationHistory}

## 输出格式
你必须只返回合法JSON，不包含任何其他文字。

执行类型：
{
  "type": "execute",
  "actions": [...],
  "confirmMessage": "用一句话告诉用户你做了什么"
}

澄清类型（当指令模糊无法确定执行方向时）：
{
  "type": "clarify",
  "question": "用一句话问用户",
  "options": ["选项A", "选项B", "选项C"]
}

## Actions 格式
每个action必须包含type字段，支持：
- add_shape: { type, shape, x, y, width, height, backgroundColor, strokeColor, label, id }
- modify_shape: { type, targetId, changes: { backgroundColor, strokeColor, x, y, width, height, label } }
- delete_shape: { type, targetId }
- add_arrow: { type, fromId, toId, label }
- clear_canvas: { type }

## 画布坐标规则
- 画布尺寸约 1200x800
- 左上角为(0,0)，右下角为(1200,800)
- "左边"约为x:100-300，"中间"约为x:400-600，"右边"约为x:700-1000
- "上方"约为y:100-250，"中间"约为y:300-500，"下方"约为y:550-700
- 默认矩形大小：width:120, height:60
- 默认圆形大小：width:80, height:80

## 上下文引用规则
- "那个" / "它" / "刚才的" → 优先指最近操作的元素
- "左边的" / "右边的" → 按画布位置匹配最近元素
- "所有" → 批量操作全部同类元素

## 触发澄清的情况
- 指令是纯评价性语言且没有明确方向（"感觉不好看"、"太乱了"）
- 目标元素有歧义且画布上有2个以上同类元素
- 禁止乱猜执行，宁可澄清

## 简单指令本地处理（不需要调API，前端直接处理）
- "撤销" / "ctrl+z" / "退一步" → 触发Excalidraw自带撤销
- "清空" / "全部删掉" → 直接清空画布

颜色关键词映射：
红色→#FF4444, 蓝色→#4A90D9, 绿色→#52C41A, 黄色→#FADB14,
橙色→#FF7A00, 紫色→#7B5EA7, 黑色→#000000, 白色→#FFFFFF, 灰色→#8C8C8C
```

### 6.3 画布状态序列化（`canvasSerializer.js`）

**不传完整Excalidraw JSON**，只传压缩描述：

```javascript
// 输出格式示例：
// "画布元素：[rect_001:矩形@(100,100),红色,120x60,label=用户登录] [circle_001:圆@(300,200),蓝色,80x80] [arrow_001:箭头,from=rect_001,to=circle_001]"

function serializeCanvas(elements) {
  return elements.map(el => {
    const id = el.id.slice(0, 12);  // 截短ID
    if (el.type === 'rectangle') 
      return `[${id}:矩形@(${Math.round(el.x)},${Math.round(el.y)}),${colorName(el.backgroundColor)},${el.width}x${el.height}${el.label ? ',label='+el.label : ''}]`;
    if (el.type === 'ellipse')
      return `[${id}:圆@(${Math.round(el.x)},${Math.round(el.y)}),${colorName(el.backgroundColor)},${el.width}x${el.height}]`;
    if (el.type === 'arrow')
      return `[${id}:箭头,from=${el.startBinding?.elementId?.slice(0,12)},to=${el.endBinding?.elementId?.slice(0,12)}]`;
    if (el.type === 'text')
      return `[${id}:文字@(${Math.round(el.x)},${Math.round(el.y)}),"${el.text}"]`;
  }).join(' ');
}
```

---

## 7. Token 控制策略（硬性约束）

| 策略 | 实现方式 |
|------|---------|
| STT 零成本 | Web Speech API，不调付费接口 |
| 按句触发 | 非持续流式，用户停顿后才发送 |
| 画布状态压缩 | 用 `canvasSerializer.js` 序列化，不传完整JSON |
| 本地处理简单指令 | 撤销/清空在前端直接处理，不调API |
| 对话历史截断 | 只保留最近 5 轮，超出截断 |
| **目标：** 每次调用平均 < 1000 tokens | 超出时在后端记录警告日志 |

---

## 8. 延迟控制策略（硬性约束）

| 策略 | 实现方式 |
|------|---------|
| STT 实时显示 | 转写文字同步显示在输入框，用户感知到在处理 |
| Streaming 输出 | Claude API 使用 `stream: true`，逐token返回 |
| 提前执行 | 收到完整JSON的第一个action即开始执行画布操作 |
| **目标：** 简单指令 < 1.5s，复杂指令 < 3s | 超时在FeedbackBar上方显示"正在思考..." |

---

## 9. 埋点规格

### 9.1 埋点触发时机

| 事件 | 触发时机 | 数据 |
|------|---------|------|
| `command` | 每次AI执行或澄清完成 | input + output + latency + token |
| `feedback` | 用户点击FeedbackBar按钮 | feedback_type + 关联command_log_id |

### 9.2 前端调用方式

```javascript
// services/analytics.js
export async function trackCommand({ sessionId, input, output, latencyMs, tokenCount, isClarify }) {
  const res = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      eventType: 'command',
      data: { input, output, latencyMs, tokenCount, isClarify }
    })
  });
  const { id } = await res.json();  // 返回command_log_id，存给FeedbackBar用
  return id;
}

export async function trackFeedback({ sessionId, commandLogId, feedbackType, input, output }) {
  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      eventType: 'feedback',
      data: { commandLogId, feedback: feedbackType, input, output }
    })
  });
}
```

---

## 10. 开源引用声明规范

开发过程中**允许参考和借鉴**以下类型的开源项目：
- Excalidraw 官方示例代码
- Web Speech API 封装库
- React + Excalidraw 集成示例

**必须遵守：**
1. 不直接复制粘贴完整文件，只参考逻辑思路
2. 所有借鉴的开源项目必须在 `README.md` 的 `## 致谢` 部分声明，格式：
   ```
   - [项目名](URL) - 用于：[具体用途]，许可证：[MIT/Apache等]
   ```
3. 代码重复率目标 < 30%（比赛评审要求）

---

## 11. Manus 交付物规范

> 此部分直接发给 Manus 作为设计指令

**Manus 的工作：** 只负责视觉设计，不写任何业务逻辑。

**交付格式：**
1. `design-tokens.css`：定义所有颜色/字体/间距 CSS 变量
2. 每个组件对应一个 CSS 文件，命名与上方文件结构一致
3. 一份静态 HTML 参考稿（`design-preview.html`），展示完整视觉效果

**Class 命名约定（Manus 必须使用以下命名，不得自创）：**
```
.voice-input-container / .voice-btn / .voice-btn--recording / .transcript-display
.chat-panel / .chat-message / .chat-message--user / .chat-message--ai
.canvas-container
.feedback-bar / .feedback-btn / .feedback-btn--great / .feedback-btn--good / .feedback-btn--bad
.api-key-modal / .api-key-input / .api-key-status
.clarify-dialog / .clarify-question / .clarify-options / .clarify-option-btn
.app-header / .app-layout / .input-area
```

**设计方向提示（给 Manus 的自由度）：**
- 整体氛围：专业但不冷漠，适合创意工作者使用
- 核心入口（麦克风按钮）要有存在感，是页面视觉重心之一
- 录音中状态需要有明显的视觉反馈（动效自由发挥）
- 其余审美决策完全交给 Manus，不做限制

---

## 12. 部署规格（WorkBuddy 参考）

```dockerfile
# Dockerfile 结构
FROM node:20-alpine

WORKDIR /app

# 后端
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# 前端构建
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/ ./backend/

# 将前端构建产物放入后端静态服务
RUN cp -r frontend/dist backend/public

EXPOSE 3000
CMD ["node", "backend/server.js"]
```

**环境变量：**
```
ANTHROPIC_API_KEY=sk-ant-...   # 默认API Key
PORT=3000
NODE_ENV=production
```

**后端同时 serve 前端静态文件：**
```javascript
// server.js 中加入
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
```

---

## 13. Day 1 开发优先级（Claude Code 第一天任务）

**按此顺序开发，确保每步都可运行：**

1. `[ ]` 初始化项目结构（前端 Vite+React，后端 Express）
2. `[ ]` 嵌入 Excalidraw，画布可以正常显示和手动操作
3. `[ ]` 实现 `useVoiceInput.js`，语音→文字显示在输入框
4. `[ ]` 实现后端 `/api/chat` 接口（先 mock 返回固定JSON验证流程）
5. `[ ]` 实现 `canvasSerializer.js` + `promptBuilder.js`
6. `[ ]` 接入真实 Claude API，调通完整链路
7. `[ ]` 实现基础 actions 执行：add_shape / modify_shape
8. `[ ]` 实现 `ApiKeyConfig.jsx`（sessionStorage存取）
9. `[ ]` 实现 `FeedbackBar.jsx` + 后端埋点接口
10. `[ ]` 端到端验证：说"画一个红色矩形" → 画布出现图形

**Day 1 结束验收标准：** 能完整走通 US-001、US-002、US-003。

---

*本文档同时作为 Claude Code 第一条指令输入。Manus 只读第11节。WorkBuddy 只读第12节。*
