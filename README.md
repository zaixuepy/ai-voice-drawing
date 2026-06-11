# AI 语音绘图工具 (AI Voice Drawing Tool)

> 一款纯语音控制的绘图工具——用说话代替鼠标，把脑子里的图画出来。

## 一句话定位

用户无需使用鼠标或键盘，仅通过语音指令即可在画布上创建、修改、连接图形元素。

## 功能特性

- 语音→画布基础图形（矩形、圆形、箭头等）
- 一句话设定属性（颜色、大小、位置）
- 上下文引用（"把那个圆变成蓝色"）
- 模糊指令容错（AI 反问而非乱猜）
- 图形连接、文字标注、撤销操作

## 技术栈

- **前端框架：** React
- **画布引擎：** Excalidraw
- **语音识别：** Web Speech API
- **AI 能力：** Claude API
- **部署平台：** Vercel

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
/
├── docs/                    # 设计文档
│   └── PRD_VoiceDrawing_v1.0.md
├── src/                     # 源代码
│   ├── components/          # UI 组件
│   ├── hooks/               # 自定义 Hooks（语音、AI）
│   ├── utils/               # 工具函数
│   └── ...
├── README.md
└── package.json
```

## Demo 视频

> 待上传（将放置于 bilibili / 云盘等外部平台）

## 设计文档

详见 [PRD_VoiceDrawing_v1.0.md](docs/PRD_VoiceDrawing_v1.0.md)

## 许可

本项目为七牛云 2026 黑客马拉松参赛作品。
