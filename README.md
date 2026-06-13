# AI 语音绘图工具 — VoiceDraw

> 用说话代替鼠标，把脑子里的图画出来。
>
> **七牛云 2026 黑客马拉松参赛作品** | 选题：题目二：AI 语音绘图工具 | 2026-06-12

---

## 作品简介

无需鼠标键盘，仅通过语音对话完成绘图。核心差异化是**真正的语音对话**——AI 播报完自动开麦，用户直接开口打断，全程无需手操作。

## 当前进度

### Day 2（6月13日）

- ✅ 小红书舆情爬虫 + 分析（基于 MediaCrawler 封装）
- ✅ 3619 条用户评论/笔记情感分析：正面 44.3% / 中性 26.4% / 负面 29.3%
- ✅ 词云可视化 + LDA 主题建模
- ✅ 绘图工具痛点舆情分析报告

详见 [舆情分析摘要](docs/analysis/analysis_summary.txt)

### Day 1（6月12日）

- ✅ 持续语音对话循环（自动开麦、打断 AI、语音选选项）
- ✅ 6 层系统提示词架构（借鉴 Claude Code 设计模式）
- ✅ 四层回退 JSON 提取策略（解析可靠性大幅提升）
- ✅ 画布嵌入 Excalidraw，支持语音操作
- ✅ Manus 设计系统前端
- ✅ 浏览器中文音色一键切换
- ✅ 延迟权限请求（首次点击麦克风才弹权限）

详见 [6月12日进度总结](docs/2026-06-12-进度总结.md)

## Demo 视频

> 待上传（将放置于 bilibili / 云盘等外部平台）

## 功能特性

| 功能 | 说明 | 状态 |
|------|------|------|
| 持续语音对话 | 一次开麦，持续对话，AI 播完自动开麦 | ✅ 已实现 |
| 语音打断 | 用户开口即打断 AI 播报 | ✅ 已实现 |
| 语音选选项 | Clarify 选项说"一/二/三"选择 | ✅ 已实现 |
| 模糊指令容错 | AI 反问而非乱猜 | ✅ 已实现 |
| 基础图形绘制 | 矩形、圆形、箭头、文字等 | ✅ 已实现 |
| 属性设定 | 颜色、大小、位置 | ✅ 已实现 |
| 思维导图 | 语音生成思维导图 | ✅ 已实现 |
| JSON 解析鲁棒 | 四层回退提取 + 自动重试 | ✅ 已实现 |
| 撤销操作 | 说"撤销"回退 | 规划中 |
| 自动布局算法 | LLM 输出关系，前端计算坐标 | 规划中 |

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + Vite | 单页面应用 |
| 画布引擎 | @excalidraw/excalidraw | npm 包嵌入 |
| 语音识别 | Web Speech API | 浏览器原生，零成本 |
| 语音合成 | SpeechSynthesis API | 浏览器 TTS，支持音色切换 |
| AI 能力 | DeepSeek API (v4 flash) | 通过后端代理调用 |
| 后端 | Node.js + Express | API 代理 + 埋点存储 |
| 数据库 | SQLite (better-sqlite3) | 指令日志 + 反馈埋点 |
| 部署 | 腾讯云容器 (Docker) | Dockerfile + docker-compose |

## 项目结构

```
/
├── frontend/                 # React 前端
│   └── src/
│       ├── components/       # UI 组件
│       ├── hooks/            # useVoiceInput / useTTS / useCommandProcessor
│       ├── services/         # deepseekApi / analytics
│       ├── utils/            # promptBuilder / canvasSerializer
│       └── pages/            # AppPage 主页面
├── backend/                  # Express 后端
│   ├── routes/               # chat / analytics
│   ├── db/                   # SQLite 初始化
│   └── server.js
├── docs/                     # 设计文档（按产品思维链条组织）
│   ├── 01-product/           # 产品文档（PRD、舆情报告）
│   ├── 02-tech/              # 技术规格
│   ├── 03-research/          # 调研分析（竞品报告、舆情分析）
│   ├── 04-prompts/           # 多平台协作 Prompt（核心产品思维体现）
│   ├── 05-external/          # 外部平台交付物（Kimi）
│   └── 06-progress/          # 每日进度总结
├── tools/                    # 工具脚本
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- DeepSeek API Key

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/zaixuepy/ai-voice-drawing.git
cd ai-voice-drawing

# 后端
cd backend
npm install
DEEPSEEK_API_KEY=sk-xxx node server.js    # 默认监听 :3000

# 前端（新终端）
cd frontend
npm install
npm run dev                                # 默认监听 :5173
```

打开 http://localhost:5173，点击麦克风开始对话。

### Docker 部署

```bash
docker-compose up -d
```

## 核心设计亮点

### 1. 持续对话循环

```
用户说话 → STT 转文字 → DeepSeek 解析意图
    → JSON 指令执行 → 画布更新
    → TTS 播报确认 → 自动开麦 → 循环
```

用户开口即打断 TTS，全程无需手操作。

### 2. 六层系统提示词架构

| 层级 | 解决的问题 |
|------|-----------|
| 身份锚定 | 明确角色边界 |
| 核心原则（6条） | 不可违反的硬约束 |
| 决策框架（6级判断树） | 何时执行 vs 何时询问 |
| 输出格式 | `<output>` 标签包裹 JSON，代码层精确提取 |
| 布局规则 | 思维导图固定坐标，流程图垂直排列 |
| 自检清单 | 6 条输出前检查 |

### 3. JSON 提取四层回退

1. `<output>` 标签提取
2. 字符串感知括号匹配
3. 反向匹配
4. 正则候选提取

解析失败自动重试最多 3 次。

## 依赖声明

### 前端

| 依赖 | 用途 | 许可 |
|------|------|------|
| react 18 | UI 框架 | MIT |
| @excalidraw/excalidraw | 画布引擎 | MIT |
| vite 5 | 构建工具 | MIT |

### 后端

| 依赖 | 用途 | 许可 |
|------|------|------|
| express 4 | HTTP 服务 | MIT |
| better-sqlite3 | 数据库 | MIT |
| cors | 跨域 | MIT |
| dotenv | 环境变量 | MIT |

## 设计文档

### 产品文档
- [PRD v1.0](docs/01-product/PRD_VoiceDrawing_v1.0.md) — 产品需求文档
- [PRD v1.0 PDF](docs/01-product/PRD_VoiceDrawing_v1.0.pdf) — PDF 版本

### 技术文档
- [技术规格 v1.0](docs/02-tech/TECH_SPEC_VoiceDrawing_v1.0.md) — 开发依据

### 调研分析
- [竞品深度研究报告](docs/03-research/语音AI绘图工具竞品深度研究报告.docx) — Canva/Adobe/Excalidraw生态
- [绘图工具痛点舆情分析报告](docs/03-research/画图工具痛点舆情分析报告.docx) — 小红书用户痛点挖掘
- [舆情分析方法与产出](docs/03-research/analysis/) — 爬虫脚本、分析摘要、词云图

### 多平台协作 Prompt（产品思维核心体现）
- [Claude Code 开发指令](docs/04-prompts/01_ClaudeCode_Prompt.md) — STEP 1 骨架 + STEP 3 合并
- [Manus 设计指令](docs/04-prompts/02_Manus_Prompt.md) — 视觉设计规范
- [Kimi 辅助任务](docs/04-prompts/03_Kimi_Prompt.md) — API 文档和测试用例
- [WorkBuddy 部署指令](docs/04-prompts/04_WorkBuddy_Prompt.md) — 腾讯云容器部署
- [Claude Code Prompt 工程](docs/04-prompts/05_ClaudeCode_PromptEngineering.md) — promptBuilder/Validator/TestCases 设计

### 外部平台交付物
- [Kimi 交付：Excalidraw API 与测试用例](docs/05-external/Kimi_Delivery_Excalidraw_API_and_Prompt_TestCases.md)
- [Kimi 补充：头脑风暴与技术建议](docs/05-external/Kimi_Supplement_Brainstorm.md)

### 进度记录
- [6月12日进度总结](docs/06-progress/2026-06-12-进度总结.md) — Day 1 核心改进

## 致谢

- [Excalidraw](https://github.com/excalidraw/excalidraw) — 白板画布嵌入，许可证：MIT
- [DeepSeek](https://deepseek.com) — AI 指令解析
- [MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) — 小红书舆情数据爬取，许可证：MIT。本项目封装为自动爬虫+分析 skill，用于绘图工具用户痛点研究

## 许可

本项目为七牛云 2026 黑客马拉松参赛作品。知识产权归参赛队伍所有。
