# Kimi 辅助任务交付文档

> **日期：** 2026-06-12  
> **用途：** 交付 Claude Code 开发参考  
> **来源：** Excalidraw 官方文档 + npm 包源码分析

---

## 辅助任务 A：Excalidraw API 文档整理

### 1. 如何以编程方式添加元素？

#### 1.1 updateScene 的正确调用方式

`updateScene` 接受一个 `sceneData` 对象，包含以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `elements` | `ImportedDataState["elements"]` | 要更新的元素数组 |
| `appState` | `ImportedDataState["appState"]` | 应用状态（可选） |
| `collaborators` | `Map<string, Collaborator>` | 协作者（可选） |
| `captureUpdate` | `CaptureUpdateAction` | 控制是否进入 undo/redo 历史栈 |

**captureUpdate 的三个值：**
- `CaptureUpdateAction.IMMEDIATELY` — 立即进入 undo/redo 栈（推荐用于本地更新）
- `CaptureUpdateAction.EVENTUALLY` — 延迟进入（用于异步多步操作）
- `CaptureUpdateAction.NEVER` — 永不进入（用于远程更新或初始化）

```javascript
import { Excalidraw, convertToExcalidrawElements, restoreElements, CaptureUpdateAction } from "@excalidraw/excalidraw";

// ===== 方式一：使用 Skeleton API（推荐，最简洁）=====
// convertToExcalidrawElements 会自动补全所有必填字段
const addRectangle = () => {
  if (!excalidrawAPI) return;

  const newElements = convertToExcalidrawElements([
    {
      type: "rectangle",
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      backgroundColor: "#FF4444",
      strokeColor: "#000000",
    }
  ], { regenerateIds: false }); // 保留自定义 id

  excalidrawAPI.updateScene({
    elements: [
      ...excalidrawAPI.getSceneElements(),
      ...newElements,
    ],
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
};

// ===== 方式二：使用完整 ExcalidrawElement 对象 =====
// 需要手动提供所有必填字段（不推荐，容易遗漏）
const addRectangleFull = () => {
  const rect = {
    id: "rect_001",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 120,
    height: 60,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#FF4444",
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: Math.floor(Math.random() * 1000000000),
    version: 1,
    versionNonce: Date.now(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), rect],
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
};
```

#### 1.2 元素对象的完整字段结构

**Rectangle（矩形）— 必填 vs 可选**

```javascript
{
  // ===== 必填字段 =====
  id: "rect_001",           // 唯一标识符（string）
  type: "rectangle",         // 固定值
  x: 100,                    // 左上角 x 坐标
  y: 100,                    // 左上角 y 坐标
  width: 120,                // 宽度
  height: 60,                // 高度

  // ===== 可选字段（有默认值）=====
  angle: 0,                  // 旋转角度（弧度）
  strokeColor: "#1e1e1e",    // 边框颜色
  backgroundColor: "transparent",  // 填充颜色
  fillStyle: "hachure",      // 填充样式: "hachure" | "cross-hatch" | "solid"
  strokeWidth: 2,            // 边框粗细: 1 | 2 | 4
  strokeStyle: "solid",      // 边框样式: "solid" | "dashed" | "dotted"
  roughness: 1,              // 手绘粗糙度: 0 | 1 | 2
  opacity: 100,              // 不透明度: 0-100
  roundness: { type: 3 },    // 圆角: null（直角）| { type: 3 }（圆角）

  // ===== 内部管理字段（建议由 Excalidraw 自动生成）=====
  seed: 123456789,           // 随机种子（影响手绘效果）
  version: 1,                // 版本号
  versionNonce: Date.now(),  // 版本随机数
  isDeleted: false,          // 是否已删除
  updated: Date.now(),       // 最后更新时间戳
  groupIds: [],              // 所属组 ID 列表
  frameId: null,             // 所属 frame ID
  boundElements: null,       // 绑定元素列表
  link: null,                // 超链接
  locked: false,             // 是否锁定
}
```

**Ellipse（圆形/椭圆）— 必填 vs 可选**

```javascript
{
  id: "circle_001",
  type: "ellipse",           // 固定值
  x: 300,
  y: 200,
  width: 80,                 // 水平直径
  height: 80,                // 垂直直径（相等则为正圆）

  // 其他可选字段与 Rectangle 相同
  backgroundColor: "#4A90D9",
  strokeColor: "#1e1e1e",
  fillStyle: "hachure",
  strokeWidth: 2,
  // ... 同上
}
```

**Arrow（箭头）— 必填 vs 可选**

```javascript
{
  id: "arrow_001",
  type: "arrow",             // 固定值
  x: 220,                    // 起点 x 坐标
  y: 130,                    // 起点 y 坐标

  // ===== 必填：箭头路径点 =====
  // points 是相对于 x,y 的偏移数组
  // 第一个点必须是 [0, 0]
  points: [[0, 0], [80, 0]],

  // ===== 可选：绑定到元素 =====
  startBinding: {
    elementId: "rect_001",   // 起点绑定的元素 ID
    focus: 0,                // 连接点偏移（-1 ~ 1）
    gap: 5,                  // 与元素边界的间距
  },
  endBinding: {
    elementId: "circle_001", // 终点绑定的元素 ID
    focus: 0,
    gap: 5,
  },

  // 箭头样式
  startArrowhead: null,      // 起点箭头: null | "arrow" | "bar" | "dot" | "triangle"
  endArrowhead: "arrow",     // 终点箭头

  // 其他可选字段
  strokeColor: "#1e1e1e",
  strokeWidth: 2,
  strokeStyle: "solid",      // 可设为 "dashed"
  // ... 其他同 Rectangle
}
```

**Text（文字）— 必填 vs 可选**

```javascript
{
  id: "text_001",
  type: "text",              // 固定值
  x: 100,
  y: 100,
  text: "Hello World",       // 文字内容（必填）

  // 可选
  fontSize: 20,              // 字号（默认 20）
  fontFamily: 1,             // 字体: 1=Virgil(手绘) | 2=Helvetica | 3=Cascadia(等宽)
  textAlign: "left",         // 水平对齐: "left" | "center" | "right"
  verticalAlign: "top",      // 垂直对齐: "top" | "middle" | "bottom"
  baseline: 18,              // 基线偏移（需根据 fontSize 计算）

  // 绑定到容器（如矩形内的文字）
  containerId: "rect_001", // 指向容器元素 ID

  // 颜色
  strokeColor: "#1e1e1e",    // 文字颜色（Excalidraw 用 strokeColor 表示文字颜色）
  backgroundColor: "transparent",

  // 尺寸（建议让 Excalidraw 自动计算，或预先测量）
  width: 100,                // 文字包围盒宽度
  height: 25,                // 文字包围盒高度

  // ... 其他同 Rectangle
}
```

---

### 2. 如何绑定箭头的起点和终点到具体元素？

箭头绑定是**双向引用**机制，需要同时设置：

#### 2.1 startBinding / endBinding 的正确格式

```javascript
// ===== 箭头端：声明 startBinding / endBinding =====
{
  id: "arrow_001",
  type: "arrow",
  x: 220,
  y: 130,
  points: [[0, 0], [80, 0]],

  startBinding: {
    elementId: "rect_001",   // 被绑定元素的 id
    focus: 0,                // 连接点沿边偏移（-1=最左/上, 0=中心, 1=最右/下）
    gap: 5,                  // 与元素边界的距离（像素）
    // fixedPoint: [0.5, 0.5001],  // 新版 API 替代 focus/gap 的方式（可选）
    // mode: "orbit",              // 绑定模式: "orbit" | "inside" | "skip"
  },

  endBinding: {
    elementId: "circle_001",
    focus: 0,
    gap: 5,
  },

  endArrowhead: "arrow",
}
```

#### 2.2 被绑定元素端：声明 boundElements

```javascript
// ===== 矩形端：在 boundElements 中声明被绑定的箭头 =====
{
  id: "rect_001",
  type: "rectangle",
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  boundElements: [
    { id: "arrow_001", type: "arrow" },   // ← 必须声明！
    { id: "text_001", type: "text" },     // 文字绑定也同理
  ],
}

// ===== 圆形端：同样声明 =====
{
  id: "circle_001",
  type: "ellipse",
  x: 300,
  y: 200,
  width: 80,
  height: 80,
  boundElements: [
    { id: "arrow_001", type: "arrow" },   // ← 必须声明！
  ],
}
```

#### 2.3 gap 和 focus 字段的含义

| 字段 | 类型 | 说明 |
|------|------|------|
| `focus` | `number` | 连接点在目标元素边缘上的位置偏移。`0` = 边缘中心，`-1` = 最左/上，`1` = 最右/下。范围 `-1 ~ 1`。 |
| `gap` | `number` | 箭头端点与目标元素边界之间的安全间距（像素）。推荐值 `1 ~ 10`。 |

```javascript
// focus 示例：让箭头连接到矩形的右侧中心
startBinding: {
  elementId: "rect_001",
  focus: 0,        // 边缘中心
  gap: 5,          // 离边缘 5px
}

// 新版 fixedPoint 方式（更精确）
startBinding: {
  elementId: "rect_001",
  fixedPoint: [1, 0.5001],  // [x比例, y比例]：1=右边缘, 0.5001=垂直中心
  mode: "orbit",            // 箭头连接到形状边缘
}
// fixedPoint 坐标参考：
// [0, 0] = 左上      [0.5001, 0] = 上中     [1, 0] = 右上
// [0, 0.5001] = 左中  [0.5001, 0.5001] = 中心 [1, 0.5001] = 右中
// [0, 1] = 左下      [0.5001, 1] = 下中     [1, 1] = 右下
```

#### 2.4 完整绑定示例

```javascript
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

const createConnectedDiagram = () => {
  const rect1 = {
    id: "rect_001",
    type: "rectangle",
    x: 100, y: 100, width: 120, height: 60,
    backgroundColor: "#a5d8ff",
    boundElements: [{ id: "arrow_001", type: "arrow" }],
  };

  const rect2 = {
    id: "rect_002",
    type: "rectangle",
    x: 350, y: 100, width: 120, height: 60,
    backgroundColor: "#b2f2bb",
    boundElements: [{ id: "arrow_001", type: "arrow" }],
  };

  const arrow = {
    id: "arrow_001",
    type: "arrow",
    x: 220, y: 130,
    points: [[0, 0], [130, 0]],
    startBinding: { elementId: "rect_001", focus: 0, gap: 5 },
    endBinding: { elementId: "rect_002", focus: 0, gap: 5 },
    endArrowhead: "arrow",
  };

  const elements = convertToExcalidrawElements([rect1, rect2, arrow], { regenerateIds: false });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), ...elements],
  });
};
```

---

### 3. 如何获取当前画布所有元素？

```javascript
// ===== 获取所有未删除的元素 =====
const elements = excalidrawAPI.getSceneElements();
// 返回: NonDeletedExcalidrawElement[]

// ===== 获取所有元素（包括已删除的）=====
const allElements = excalidrawAPI.getSceneElementsIncludingDeleted();
// 返回: ExcalidrawElement[]

// ===== 获取应用状态 =====
const appState = excalidrawAPI.getAppState();

// ===== 获取文件（图片等）=====
const files = excalidrawAPI.getFiles();

// ===== 获取当前选中元素 =====
const selectedIds = appState.selectedElementIds;  // { [id]: true }
```

---

### 4. 如何实现撤销？

**结论：没有直接暴露的 `undo()` API，必须通过模拟键盘事件或利用 `captureUpdate` 策略。**

```javascript
// ===== 方式一：利用 captureUpdate 让 updateScene 自动进入 undo 栈 =====
// 这是推荐方式。只要调用 updateScene 时设置 captureUpdate: IMMEDIATELY，
// 用户就可以用 Ctrl+Z 撤销。

excalidrawAPI.updateScene({
  elements: newElements,
  captureUpdate: CaptureUpdateAction.IMMEDIATELY,  // ← 关键！
});

// 然后用户按 Ctrl+Z 即可撤销

// ===== 方式二：模拟键盘事件触发撤销 =====
// 当需要程序化触发撤销时（如语音指令"撤销"）
const triggerUndo = () => {
  const event = new KeyboardEvent("keydown", {
    key: "z",
    code: "KeyZ",
    ctrlKey: true,
    bubbles: true,
  });
  document.dispatchEvent(event);
};

// ===== 方式三：清空历史（不常用）=====
excalidrawAPI.history.clear();  // 清空 undo/redo 历史栈

// ===== 方式四：resetScene（清空画布）=====
excalidrawAPI.resetScene();  // 清空所有元素，可选 resetLoadingState
```

**重要说明：**
- `updateScene` 默认 `captureUpdate` 行为取决于版本，建议显式设置
- 部分 `appState` 更新不会被历史记录（如 collaborators 变更）
- 远程协作更新应使用 `CaptureUpdateAction.NEVER`

---

### 5. 元素的 id 字段规则

#### 5.1 可以自定义 id 吗？

**可以**，但需要注意：

```javascript
// ===== 使用 Skeleton API 时保留自定义 id =====
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

const elements = convertToExcalidrawElements(
  [
    { id: "rect_001", type: "rectangle", x: 100, y: 100, width: 120, height: 60 },
    { id: "arrow_001", type: "arrow", x: 220, y: 130, points: [[0, 0], [80, 0]] },
  ],
  { regenerateIds: false }  // ← 关键！设为 false 保留自定义 id
);

// 如果不传 regenerateIds: false，convertToExcalidrawElements 会重新生成随机 id
```

#### 5.2 id 的格式要求

| 要求 | 说明 |
|------|------|
| **唯一性** | 同一画布内必须全局唯一 |
| **字符集** | 理论上任意字符串均可，但推荐 URL-safe 字符：`A-Za-z0-9_-` |
| **长度** | 无硬性限制，官方使用 nanoid 生成的 21 位随机字符串 |
| **稳定性** | 一旦创建不应变更，否则绑定关系会断裂 |

```javascript
// Excalidraw 内部使用的 id 格式（nanoid 生成）
// 示例: "xw25sQBsbd2mecyjTrYHA"  
// 长度: 21 字符
// 字符集: A-Za-z0-9_-

// 自定义 id 的推荐格式（用于本项目）
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
// 示例输出: "rect_1718182800000_a3f9b2"

// 或者使用 nanoid 库
import { nanoid } from "nanoid";
const id = nanoid(12);  // 12 位随机 id，如 "V1StGXR8_Z5j"
```

#### 5.3 项目中的 id 生成策略建议

```javascript
// utils/idGenerator.js
import { nanoid } from "nanoid";

export const generateElementId = (type) => {
  const prefixMap = {
    rectangle: "rect",
    ellipse: "circle",
    arrow: "arrow",
    text: "text",
    diamond: "diamond",
  };
  const prefix = prefixMap[type] || "el";
  return `${prefix}_${nanoid(8)}`;  // 如 "rect_a3f9b2d1"
};

// 使用示例
const rectId = generateElementId("rectangle");  // "rect_xK9mNpQ2"
const arrowId = generateElementId("arrow");   // "arrow_bL4vWjR7"
```

---

## 辅助任务 B：系统 Prompt 测试用例设计

### 测试用例总表

| 用例ID | 输入文字 | 画布状态 | 期望输出类型 | 期望关键字段 | 测试重点 |
|--------|----------|----------|-------------|-------------|----------|
| **类别1：基础指令（应返回 execute）** |
| TC-001 | "画一个矩形" | 空画布 | execute | actions[0].type="add_shape", shape="rectangle" | 最基础图形创建 |
| TC-002 | "画一个圆" | 空画布 | execute | actions[0].type="add_shape", shape="ellipse" | 圆形识别（ellipse 类型） |
| TC-003 | "画一个箭头" | 空画布 | execute | actions[0].type="add_arrow" | 箭头独立创建（无绑定目标时） |
| TC-004 | "添加文字'你好世界'" | 空画布 | execute | actions[0].type="add_shape", shape="text", label="你好世界" | 文字元素创建 |
| TC-005 | "画一个菱形" | 空画布 | execute | actions[0].type="add_shape", shape="diamond" | 菱形/钻石形状 |
| **类别2：属性指令（应返回 execute）** |
| TC-006 | "在左上角画一个红色大圆" | 空画布 | execute | x∈[100,300], y∈[100,250], backgroundColor="#FF4444", width≥100, height≥100 | 位置+颜色+大小复合属性 |
| TC-007 | "在右下角画一个蓝色小矩形" | 空画布 | execute | x∈[700,1000], y∈[550,700], backgroundColor="#4A90D9", width≤80, height≤50 | 右下角位置+小尺寸 |
| TC-008 | "画一个绿色边框的矩形" | 空画布 | execute | strokeColor="#52C41A"（注意是边框色不是填充色） | strokeColor vs backgroundColor 区分 |
| TC-009 | "画一个橙色半透明矩形" | 空画布 | execute | backgroundColor="#FF7A00", opacity<100 | 透明度属性 |
| TC-010 | "在中间画一个紫色圆，写上'开始'" | 空画布 | execute | actions.length=2, 第二个 action 的 containerId 指向第一个 | 多元素+文字绑定 |
| **类别3：上下文引用（应返回 execute）** |
| TC-011 | "把那个矩形变成红色" | [rect_001:矩形@(100,100),蓝色,120x60] | execute | actions[0].type="modify_shape", targetId="rect_001", changes.backgroundColor="#FF4444" | 代词"那个"指代最近元素 |
| TC-012 | "把左边的圆变大一点" | [rect_001:矩形@(500,300),蓝色,120x60]; [circle_001:圆@(100,200),红色,80x80] | execute | actions[0].targetId="circle_001", changes.width>80, changes.height>80 | "左边的"空间位置匹配 |
| TC-013 | "给那个矩形和圆之间加一条箭头" | [rect_001:矩形@(100,100),蓝色,120x60]; [circle_001:圆@(300,100),红色,80x80] | execute | actions[0].type="add_arrow", fromId="rect_001", toId="circle_001" | 两个元素间创建连接 |
| TC-014 | "把刚才画的箭头删掉" | [rect_001:矩形@(100,100)]; [arrow_001:箭头,from=rect_001,to=circle_001] | execute | actions[0].type="delete_shape", targetId="arrow_001" | "刚才的"时间上下文 |
| TC-015 | "把所有矩形都变成绿色" | [rect_001:矩形@(100,100),蓝色]; [rect_002:矩形@(300,100),红色]; [circle_001:圆@(500,100),黄色] | execute | actions.length=2, 分别 targetId="rect_001"和"rect_002", changes.backgroundColor="#52C41A" | "所有"批量操作 |
| **类别4：模糊指令（应返回 clarify）** |
| TC-016 | "感觉不好看" | [rect_001:矩形@(100,100),蓝色]; [circle_001:圆@(300,100),红色] | clarify | question 包含"具体"或"哪方面", options.length≥2 | 纯评价性语言，无操作方向 |
| TC-017 | "太乱了" | [rect_001:矩形@(100,100)]; [rect_002:矩形@(110,110)]; [rect_003:矩形@(120,120)] | clarify | options 包含"整理间距""调整大小""改变颜色"等 | 密集场景下的模糊评价 |
| TC-018 | "颜色不太对" | [rect_001:矩形@(100,100),#FF4444]; [rect_002:矩形@(300,100),#4A90D9] | clarify | options 包含"整体换配色方案""调整某个元素颜色" | 颜色相关的模糊反馈 |
| TC-019 | "帮我优化一下" | [rect_001:矩形@(100,100)]; [arrow_001:箭头,from=rect_001,to=circle_001] | clarify | question 要求用户明确优化方向 | 完全无方向的优化请求 |
| TC-020 | "这个不对" | [rect_001:矩形@(100,100),蓝色,120x60] | clarify | options 至少包含"位置""大小""颜色"三个方向 | 代词+否定词，歧义大 |
| **类别5：边界 Case** |
| TC-021 | "删除那个" | 空画布 | clarify | question 包含"没有元素"或"请先创建" | 画布为空时的删除指令 |
| TC-022 | "画一个红色矩形，再画一个蓝色圆，然后用箭头连起来" | 空画布 | execute | actions.length=3, 第三个 action 的 fromId/toId 指向前两个 | 一句话多操作拆分 |
| TC-023 | "画一个 red rectangle" | 空画布 | execute | actions[0].shape="rectangle", backgroundColor="#FF4444" | 中英文混合指令 |
| TC-024 | "把rect_001改成绿色" | [rect_001:矩形@(100,100),蓝色,120x60] | execute | actions[0].targetId="rect_001", changes.backgroundColor="#52C41A" | 直接引用 elementId |
| TC-025 | "撤销" | [rect_001:矩形@(100,100),蓝色] | execute | actions[0].type="undo"（或前端本地处理标记） | 撤销指令（应走本地处理） |
| TC-026 | "清空画布" | [rect_001:矩形@(100,100)]; [circle_001:圆@(300,100)] | execute | actions[0].type="clear_canvas" | 清空指令（应走本地处理） |
| TC-027 | "把那个圆变成红色" | [rect_001:矩形@(100,100),蓝色]; [rect_002:矩形@(300,100),绿色]; [circle_001:圆@(500,100),黄色] | clarify | question 包含"哪个圆" | 目标元素有歧义（多个同类元素） |
| TC-028 | "在上面加一个矩形" | [rect_001:矩形@(400,400),蓝色,120x60] | execute | actions[0].y < 400（在现有元素上方） | 相对位置"上面" |
| TC-029 | "画一个大一点的" | [rect_001:矩形@(100,100),蓝色,120x60] | clarify | question 包含"画什么" | 缺少形状类型的模糊指令 |
| TC-030 | "把箭头改成虚线" | [arrow_001:箭头,from=rect_001,to=circle_001] | execute | actions[0].changes.strokeStyle="dashed" | 箭头样式修改 |

---

### 测试用例详细说明

#### TC-006 详细验证点
```
输入："在左上角画一个红色大圆"
画布：空画布

期望输出：
{
  "type": "execute",
  "actions": [{
    "type": "add_shape",
    "shape": "ellipse",
    "x": 150,        // 约 100-300 范围
    "y": 175,        // 约 100-250 范围
    "width": 120,    // "大" → 大于默认 80
    "height": 120,
    "backgroundColor": "#FF4444",
    "strokeColor": "#1e1e1e"
  }],
  "confirmMessage": "已在左上角添加一个红色大圆"
}
```

#### TC-022 详细验证点（多操作拆分）
```
输入："画一个红色矩形，再画一个蓝色圆，然后用箭头连起来"
画布：空画布

期望输出：
{
  "type": "execute",
  "actions": [
    { "type": "add_shape", "shape": "rectangle", "backgroundColor": "#FF4444", "id": "rect_xxx" },
    { "type": "add_shape", "shape": "ellipse", "backgroundColor": "#4A90D9", "id": "circle_xxx" },
    { "type": "add_arrow", "fromId": "rect_xxx", "toId": "circle_xxx" }
  ],
  "confirmMessage": "已添加红色矩形、蓝色圆，并用箭头连接"
}

验证重点：
1. actions 数组长度为 3
2. 前两个 action 必须有 id 字段（供第三个引用）
3. 第三个 action 的 fromId/toId 必须与前两个 id 匹配
4. 位置应自动排布（矩形在左，圆在右，间距合理）
```

#### TC-027 详细验证点（歧义澄清）
```
输入："把那个圆变成红色"
画布：[rect_001:矩形]; [rect_002:矩形]; [circle_001:圆]; [circle_002:圆]

期望输出：
{
  "type": "clarify",
  "question": "画布上有多个圆，您想修改哪一个？",
  "options": [
    "左边的圆（circle_001）",
    "右边的圆（circle_002）",
    "所有圆"
  ]
}

验证重点：
1. 必须返回 clarify 类型，不能猜测执行
2. options 应包含具体元素标识，帮助用户选择
3. 不应直接修改任意一个圆
```

---

### Prompt 质量评估 Checklist

| 检查项 | 通过标准 |
|--------|----------|
| JSON 格式合法性 | 100% 返回可解析的合法 JSON，无 markdown 代码块包裹 |
| 类型正确性 | execute / clarify 类型判断准确，不混淆 |
| 坐标合理性 | 所有 x,y 在 [0, 1200]×[0, 800] 范围内，不超出画布 |
| 颜色映射准确性 | 中文颜色词正确映射到十六进制值 |
| 上下文引用准确性 | "那个"/"它"/"左边的"等代词正确解析到目标元素 |
| 澄清时机 | 模糊指令 100% 返回 clarify，不猜测执行 |
| 多操作拆分 | 一句话含多个操作时，actions 数组正确拆分 |
| ID 一致性 | 同一轮对话中，新增元素的 id 在 actions 间可正确引用 |
| 确认消息质量 | confirmMessage 用自然语言准确描述操作结果 |
| 边界处理 | 空画布引用、不存在的元素引用等边界情况有合理处理 |

---

*本文档由 Kimi 整理，供 Claude Code 开发参考。所有 API 信息基于 @excalidraw/excalidraw npm 包官方文档。*
