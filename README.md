# AI 语音绘图工具 (AI Voice Drawing Tool)

> 一款纯语音控制的绘图工具——用说话代替鼠标，把脑子里的图画出来。
>
> **七牛云 2026 黑客马拉松参赛作品** | 选题：题目二：AI 语音绘图工具

---

## 作品简介

用户无需使用鼠标或键盘，仅通过语音指令即可在画布上创建、修改、连接图形元素。核心差异化在于**意图理解**：上下文引用、模糊指令容错、主动确认机制——当用户说"感觉太乱了"时，AI 会反问引导而非乱猜执行。

## 功能特性

| 功能 | 说明 | 状态 |
|------|------|------|
| 语音→基础图形 | 说"画一个矩形"→画布出现矩形 | 规划中 |
| 一句话属性设定 | 颜色、大小、位置一次描述 | 规划中 |
| 上下文引用 | "把那个圆变成蓝色"，AI 理解"那个" | 规划中 |
| 图形连接 | 用箭头连接两个图形 | 规划中 |
| 模糊指令容错 | 纯评价性语言→AI 反问而非乱猜 | 规划中 |
| 文字标注 | 在图形中添加文字 | 规划中 |
| 撤销操作 | 说"撤销"回退 | 规划中 |

## Demo 视频

> 待上传（将放置于 bilibili / 云盘等外部平台）

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + Vite | 单页面应用 |
| 画布引擎 | @excalidraw/excalidraw | npm 包嵌入 |
| 语音识别 | Web Speech API | 浏览器原生，零成本 |
| AI 能力 | Claude API (claude-sonnet-4-6) | 通过后端代理调用 |
| 后端 | Node.js + Express | API 代理 + 埋点存储 |
| 数据库 | SQLite (better-sqlite3) | 埋点数据存储 |
| 部署 | 腾讯云容器 (Docker) | Dockerfile + docker-compose |

## 项目结构

```
/
├── frontend/                 # 前端应用
│   └── src/
│       ├── components/       # UI 组件
│       │   ├── VoiceInput/   # 麦克风按钮 + 实时转写
│       │   ├── ChatPanel/    # 左侧对话区
│       │   ├── Canvas/       # Excalidraw 嵌入容器
│       │   ├── FeedbackBar/  # 点赞/点踩埋点
│       │   ├── ApiKeyConfig/ # 用户自配 API Key
│       │   └── ClarifyDialog/# 模糊指令反问对话框
│       ├── hooks/            # 自定义 Hooks
│       ├── services/         # API 调用封装
│       ├── utils/            # 工具函数
│       └── styles/           # 样式文件
├── backend/                  # 后端服务
│   ├── routes/               # API 路由
│   ├── db/                   # 数据库初始化
│   └── server.js             # Express 入口
├── docs/                     # 设计文档
│   ├── PRD_VoiceDrawing_v1.0.md
│   ├── TECH_SPEC_VoiceDrawing_v1.0.md
│   └── 语音AI绘图工具竞品深度研究报告.docx
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/zaixuepy/ai-voice-drawing.git
cd ai-voice-drawing

# 后端
cd backend
npm install
cp .env.example .env   # 编辑 .env，填入 ANTHROPIC_API_KEY
npm run dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

## 依赖声明

### 前端

| 依赖 | 版本 | 用途 | 许可 |
|------|------|------|------|
| react | ^18 | UI 框架 | MIT |
| react-dom | ^18 | DOM 渲染 | MIT |
| @excalidraw/excalidraw | latest | 画布引擎 | MIT |
| vite | ^5 | 构建工具 | MIT |

### 后端

| 依赖 | 版本 | 用途 | 许可 |
|------|------|------|------|
| express | ^4 | HTTP 服务 | MIT |
| better-sqlite3 | ^11 | 数据库 | MIT |
| cors | ^2 | 跨域 | MIT |
| dotenv | ^16 | 环境变量 | MIT |

## 设计文档

- [PRD v1.0](docs/PRD_VoiceDrawing_v1.0.md) — 产品需求文档，含问题陈述、用户故事、KANO 优先级、ROI 策略
- [技术规格 v1.0](docs/TECH_SPEC_VoiceDrawing_v1.0.md) — 开发依据，含文件结构、接口规格、系统 Prompt、Token 控制策略
- [竞品深度研究报告](docs/语音AI绘图工具竞品深度研究报告.docx) — 市场空白验证、竞品对比矩阵

## 致谢

本项目开发过程中参考了以下开源项目（遵守 MIT/Apache 许可，仅参考逻辑思路，未直接复制代码）：

> 待补充（将在开发过程中持续更新）

## 许可

本项目为七牛云 2026 黑客马拉松参赛作品。知识产权归参赛队伍所有。
