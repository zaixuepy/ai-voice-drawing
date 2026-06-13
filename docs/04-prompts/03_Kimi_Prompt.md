# Kimi 指令（穿插在 Step 1-2 之间，辅助任务）

Kimi负责两个独立辅助任务，可以并行进行。每个任务的产出直接交给人工，由人工决定是否输入Claude Code。

---

## 辅助任务 A：Excalidraw API 文档整理

请查阅 Excalidraw 的 npm 包文档（`@excalidraw/excalidraw`），整理以下内容：

### 需要整理的问题

1. **如何以编程方式添加元素？**
   - `updateScene` 的正确调用方式
   - 元素对象的完整字段结构（rectangle / ellipse / arrow / text）
   - 必填字段 vs 可选字段

2. **如何绑定箭头的起点和终点到具体元素？**
   - `startBinding` 和 `endBinding` 的正确格式
   - `gap` 和 `focus` 字段的含义

3. **如何获取当前画布所有元素？**
   - 通过 `excalidrawAPI.getSceneElements()` 还是其他方式？

4. **如何实现撤销？**
   - 是否有 API 接口，还是只能模拟键盘事件？

5. **元素的 `id` 字段规则**
   - 可以自定义id吗？格式要求是什么？

### 整理格式

请用代码示例为主的方式整理，每个问题给出可直接使用的代码片段。例如：

```javascript
// 添加矩形示例
excalidrawAPI.updateScene({
  elements: [
    ...excalidrawAPI.getSceneElements(),
    {
      type: "rectangle",
      id: "rect_001",
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      // ... 其他字段
    }
  ]
});
```

---

## 辅助任务 B：系统Prompt测试用例设计

我们的系统prompt需要让AI将自然语言转化为JSON绘图指令。请帮我设计一套测试用例，用于验证prompt的质量。

### 背景

系统prompt会让AI只返回以下两种JSON：

**执行类型：**
```json
{"type":"execute","actions":[...],"confirmMessage":"已在左上角添加红色矩形"}
```

**澄清类型：**
```json
{"type":"clarify","question":"是元素太密集，还是颜色太相近？","options":["元素太密集","颜色太相近","其他"]}
```

### 测试用例要求

请设计以下类别的测试用例（每类至少3条）：

**类别1：基础指令（应返回execute）**
- 画基础图形：矩形/圆/箭头/文字
- 示例输入：`"画一个矩形"` → 期望输出：包含add_shape的execute

**类别2：属性指令（应返回execute）**
- 包含颜色/大小/位置的指令
- 示例输入：`"在左上角画一个红色大圆"` → 期望输出：位置x约100-200，y约100-200，颜色#FF4444

**类别3：上下文引用（应返回execute）**
- 使用"那个"/"它"/"左边的"等代词
- 需要同时提供画布状态（如"当前画布：[rect_001:矩形@(100,100),蓝色]"）
- 示例输入：`"把那个矩形变成红色"` → 期望：modify_shape targetId=rect_001

**类别4：模糊指令（应返回clarify）**
- 纯评价性语言
- 示例输入：`"感觉不好看"` → 期望：clarify类型，options至少2个方向

**类别5：边界case**
- 画布为空时说"删除那个"→ 应如何处理？
- 一句话包含多个操作→ actions数组能否正确拆分？
- 中英文混合指令→ 能否正确理解？

### 交付格式

请用表格整理，每条用例包含：
| 用例ID | 输入文字 | 画布状态 | 期望输出类型 | 期望关键字段 | 测试重点 |
