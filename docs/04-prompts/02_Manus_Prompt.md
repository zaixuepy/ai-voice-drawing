# Manus 指令（Step 2）

你是一位视觉设计师，负责为一款AI语音绘图工具设计完整的前端视觉风格。

**重要：你只负责视觉设计，不需要写任何JavaScript业务逻辑。**

---

## 产品背景

这是一款让用户"用说话代替鼠标来画图"的工具。目标用户是产品经理、技术同学等需要快速将脑中结构性想法可视化的创意工作者。

页面分为左右两栏：
- 左侧（35%）：对话区，显示用户说的话和AI的回应
- 右侧（65%）：Excalidraw画布，实时显示用户用语音创建的图形
- 底部：麦克风按钮 + 文字输入框 + 发送按钮
- 右上角：齿轮图标（API Key配置入口）

---

## 你的交付物

请交付以下文件：

### 1. `design-tokens.css`
定义全局CSS变量，包括颜色、字体、圆角、间距、阴影。格式：
```css
:root {
  --color-primary: ...;
  --color-bg: ...;
  /* 等等 */
}
```

### 2. 各组件CSS文件（共6个）
- `VoiceInput.css`
- `ChatPanel.css`
- `Canvas.css`
- `FeedbackBar.css`
- `ApiKeyConfig.css`
- `ClarifyDialog.css`

每个文件只包含该组件的样式，使用下方规定的class命名。

### 3. `design-preview.html`
一份静态HTML页面，展示完整的视觉效果（不需要功能，只需要视觉正确）。

---

## 必须使用的Class命名（不得修改、不得新增顶层class）

```
/* 语音输入 */
.voice-input-container
.voice-btn
.voice-btn--recording        /* 录音中状态 */
.transcript-display          /* 实时转写文字 */

/* 对话面板 */
.chat-panel
.chat-message
.chat-message--user          /* 用户消息：右对齐 */
.chat-message--ai            /* AI消息：左对齐 */

/* 画布 */
.canvas-container

/* 态度反馈 */
.feedback-bar
.feedback-btn
.feedback-btn--great         /* 👍 非常棒 */
.feedback-btn--good          /* 👌 还不错 */
.feedback-btn--bad           /* 👎 有待改进 */

/* API Key配置 */
.api-key-modal
.api-key-input
.api-key-status

/* 澄清对话框 */
.clarify-dialog
.clarify-question
.clarify-options
.clarify-option-btn

/* 全局布局 */
.app-header
.app-layout
.input-area
```

---

## 设计自由度

以上是硬性约束，其余完全交给你：

- 整体色调、字体、圆角、阴影风格完全自由决定
- 麦克风按钮的录音动效完全自由发挥（这是页面的视觉重心）
- `.voice-btn--recording` 状态必须有明显的视觉区分（动效、颜色变化均可）
- 澄清选项按钮（`.clarify-option-btn`）要有点击感，像"选择题选项卡"的感觉
- 三个反馈按钮（great/good/bad）视觉上要有差异，不只是emoji不同

**设计方向提示（仅供参考，你可以完全推翻）：**
- 目标用户是创意工作者，整体氛围：专业但不冷漠
- 这是一个工具类产品，不是营销页，重功能感知
- 画布区域尽量干净，不要抢Excalidraw的视觉注意力

---

## 交付格式要求

1. 所有CSS文件使用上方规定的class命名
2. 颜色值统一使用 `design-tokens.css` 中定义的CSS变量（如 `var(--color-primary)`），不硬编码颜色
3. `design-preview.html` 中内联引入所有CSS，方便直接打开预览
4. 响应式：桌面端优先，最小支持1280px宽度
