# 任务：实现并验证指令解析层的完整Prompt工程体系

## 背景说明

这是一款AI语音绘图工具。用户用语音说话，AI需要把自然语言转化为Excalidraw画布操作的JSON指令。

**核心挑战：** 这不是一个简单的"写一段system prompt"任务，而是一个需要精确设计的多层级Prompt体系。过去我们讨论认为这是整个项目技术含量最高的部分，原因是：

1. 输出格式必须100%是合法JSON，任何多余文字都会导致解析失败
2. 画布状态是动态的，每次调用内容不同，必须正确注入
3. 中文自然语言的歧义性高，代词引用（"那个"）和模糊指令（"太乱了"）需要精确的规则
4. clarify vs execute的判断边界不清晰时会造成体验崩溃

---

## 你需要实现的文件

### 文件1：`frontend/src/utils/promptBuilder.js`

负责在每次调用前动态构建完整的消息结构。

```javascript
/**
 * Prompt层级结构说明：
 * 
 * [System Prompt] - 固定内容，每次调用完全相同
 *   ├── 角色定义
 *   ├── 输出格式约束（JSON Schema）
 *   ├── 颜色映射表
 *   ├── 坐标规则
 *   ├── 代词引用规则
 *   └── clarify触发规则
 * 
 * [User Message] - 动态内容，每次调用前构建
 *   ├── ## 当前画布状态（来自canvasSerializer）
 *   ├── ## 对话历史（最近5轮，格式化为文字）
 *   └── ## 用户指令（本次语音转文字结果）
 * 
 * 重要：画布状态和对话历史必须放在User Message，不放在System Prompt
 * 原因：System Prompt会被缓存复用，动态内容放进去会破坏缓存并浪费token
 */

export function buildSystemPrompt() {
  return `你是一个绘图指令解析器。你的唯一任务是将用户的自然语言指令转化为结构化的JSON操作指令。

## 严格输出约束
你必须只返回合法JSON对象，不包含任何其他文字、代码块标记（不要用\`\`\`）、解释或换行前缀。
第一个字符必须是 {，最后一个字符必须是 }。

## 输出格式

执行类型（当指令明确可执行时）：
{"type":"execute","actions":[...actions数组...],"confirmMessage":"一句话告知用户你做了什么"}

澄清类型（当指令模糊、目标不明确时）：
{"type":"clarify","question":"一句话问用户","options":["选项A","选项B","其他"]}

## Actions格式定义

add_shape（新增图形）：
{"type":"add_shape","shape":"rect|ellipse|text","x":数字,"y":数字,"width":数字,"height":数字,"backgroundColor":"hex色值","strokeColor":"#000000","label":"可选文字","id":"shape_时间戳"}

modify_shape（修改已有图形）：
{"type":"modify_shape","targetId":"元素id","changes":{"backgroundColor":"hex","x":数字,"y":数字,"width":数字,"height":数字,"label":"文字"}}

delete_shape（删除图形）：
{"type":"delete_shape","targetId":"元素id"}

add_arrow（连接两个图形）：
{"type":"add_arrow","fromId":"起点元素id","toId":"终点元素id","label":"可选文字","id":"arrow_时间戳"}

clear_canvas（清空画布）：
{"type":"clear_canvas"}

## 坐标系规则
画布尺寸约1200x800，左上角为原点(0,0)。
位置参考：左边x≈100-300，中间x≈400-600，右边x≈700-1000；上方y≈100-250，中间y≈300-500，下方y≈550-700。
默认尺寸：矩形width:120,height:60；圆形width:80,height:80；文字不需要width/height。
新增图形时，若用户未指定位置，自动选择画布空白区域，避免与已有元素重叠。

## 颜色关键词映射
红色→#FF4444, 蓝色→#4A90D9, 绿色→#52C41A, 黄色→#FADB14,
橙色→#FF7A00, 紫色→#7B5EA7, 黑色→#1A1A1A, 白色→#FFFFFF, 灰色→#8C8C8C,
粉色→#FF85C2, 青色→#13C2C2, 默认（无颜色指定）→#4A90D9

## 上下文引用规则
"那个"/"它"/"这个"→ 优先指对话历史中最近一次操作的元素id
"左边的"→ 画布状态中x值最小的同类元素
"右边的"→ 画布状态中x值最大的同类元素
"上面的"→ 画布状态中y值最小的同类元素
"刚才的"/"刚刚的" → 对话历史中最近一次add_shape或modify_shape的targetId
"所有"/"全部" → 对画布中所有同类元素批量生成多个action

## clarify触发规则（以下情况必须返回clarify，不得猜测执行）
1. 纯评价性语言且无操作方向：如"感觉不好看"、"太乱了"、"不够清晰"、"看起来怪怪的"
2. 目标元素有歧义：画布上有2个以上同类元素，且用户用了"那个"等模糊代词
3. 指令方向不唯一：如"调整一下大小"（调大还是调小？多少？）
4. clarify的options必须是具体可操作的选项，不是泛化描述

## 边界情况处理
- 画布为空时用户说"删除那个"→ 返回clarify，question:"画布上还没有图形，你想先画什么？"，options:["画一个矩形","画一个圆形","画一个流程图"]
- 一句话包含多个操作→ actions数组中按顺序包含多个action
- 用户说"撤销"/"退一步"→ 返回 {"type":"execute","actions":[{"type":"undo"}],"confirmMessage":"已撤销上一步操作"}
- 用户说"清空"/"全删了"→ 返回 {"type":"execute","actions":[{"type":"clear_canvas"}],"confirmMessage":"已清空画布"}`;
}

export function buildUserMessage(canvasState, conversationHistory, userInput) {
  // conversationHistory格式：[{role:'user',content:'...'},{role:'assistant',content:'...'}]
  // 只取最近5轮（10条消息）
  const recentHistory = conversationHistory.slice(-10);
  
  const historyText = recentHistory.length > 0
    ? recentHistory.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n')
    : '（无历史）';

  return `## 当前画布状态\n${canvasState}\n\n## 对话历史\n${historyText}\n\n## 用户指令\n${userInput}`;
}

export function buildMessages(canvasState, conversationHistory, userInput) {
  return [
    { role: 'user', content: buildUserMessage(canvasState, conversationHistory, userInput) }
  ];
}
```

---

### 文件2：`frontend/src/utils/promptValidator.js`

**这个文件的用途是开发阶段的自我验证工具，不在生产环境运行。**

```javascript
/**
 * Prompt质量验证器
 * 用途：在开发调试阶段，对系统prompt进行结构性检查
 * 使用方式：在浏览器控制台运行 validatePromptQuality()
 */

import { buildSystemPrompt, buildUserMessage } from './promptBuilder';

// 检查1：System Prompt结构完整性
export function checkSystemPromptStructure() {
  const prompt = buildSystemPrompt();
  const required = [
    { key: '严格输出约束', check: prompt.includes('严格输出约束') },
    { key: 'execute格式', check: prompt.includes('"type":"execute"') },
    { key: 'clarify格式', check: prompt.includes('"type":"clarify"') },
    { key: 'add_shape定义', check: prompt.includes('add_shape') },
    { key: 'modify_shape定义', check: prompt.includes('modify_shape') },
    { key: '颜色映射', check: prompt.includes('#FF4444') },
    { key: '坐标规则', check: prompt.includes('1200x800') },
    { key: 'clarify触发规则', check: prompt.includes('clarify触发规则') },
  ];
  
  const missing = required.filter(r => !r.check).map(r => r.key);
  if (missing.length === 0) {
    console.log('✅ System Prompt结构完整');
  } else {
    console.error('❌ System Prompt缺少以下部分：', missing);
  }
  return missing.length === 0;
}

// 检查2：User Message是否包含动态内容
export function checkUserMessageDynamic() {
  const canvas1 = '画布元素：[rect_001:矩形@(100,100),蓝色]';
  const canvas2 = '画布为空';
  const history = [{role:'user',content:'画一个矩形'},{role:'assistant',content:'已添加矩形'}];
  
  const msg1 = buildUserMessage(canvas1, history, '把那个变成红色');
  const msg2 = buildUserMessage(canvas2, [], '画一个圆');
  
  const checks = [
    { key: '画布状态被注入', check: msg1.includes('rect_001') },
    { key: '对话历史被注入', check: msg1.includes('画一个矩形') },
    { key: '用户指令被注入', check: msg1.includes('把那个变成红色') },
    { key: '空画布正确显示', check: msg2.includes('画布为空') },
    { key: '空历史正确显示', check: msg2.includes('无历史') },
  ];
  
  const failed = checks.filter(c => !c.check).map(c => c.key);
  if (failed.length === 0) {
    console.log('✅ User Message动态内容注入正确');
  } else {
    console.error('❌ User Message注入失败：', failed);
  }
  return failed.length === 0;
}

// 检查3：Token估算（粗略）
export function estimateTokenCount(canvasElements = 10, historyRounds = 5) {
  const mockCanvas = Array(canvasElements).fill('[rect_001:矩形@(100,100),蓝色,120x60]').join(' ');
  const mockHistory = Array(historyRounds * 2).fill({role:'user',content:'画一个矩形'});
  const mockInput = '把左边的圆变成红色并连接到右边的方块';
  
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(mockCanvas, mockHistory, mockInput);
  
  // 粗略估算：中文1字≈1.5token，英文1词≈1token
  const systemTokens = Math.ceil(systemPrompt.length * 0.6);
  const userTokens = Math.ceil(userMessage.length * 0.6);
  const total = systemTokens + userTokens;
  
  console.log(`📊 Token估算（${canvasElements}个元素，${historyRounds}轮历史）：`);
  console.log(`   System Prompt: ~${systemTokens} tokens`);
  console.log(`   User Message: ~${userTokens} tokens`);
  console.log(`   总计: ~${total} tokens`);
  console.log(`   目标上限: 1000 tokens`);
  console.log(total <= 1000 ? '✅ 在目标范围内' : `⚠️ 超出目标 ${total - 1000} tokens，需要压缩`);
  
  return total;
}

export function validatePromptQuality() {
  console.log('=== Prompt质量检查 ===');
  checkSystemPromptStructure();
  checkUserMessageDynamic();
  estimateTokenCount(10, 5);
  estimateTokenCount(30, 5);  // 压力测试：30个元素时的token消耗
  console.log('=== 检查完成 ===');
}
```

---

### 文件3：`frontend/src/utils/promptTestCases.js`

**开发阶段用于手动测试prompt效果的用例集，不在生产环境运行。**

```javascript
/**
 * 系统Prompt测试用例
 * 使用方式：开发时在控制台调用 runTestCase(案例ID) 查看AI返回
 * 验证AI返回是否符合预期
 */

export const TEST_CASES = [
  // --- P0：基础执行类 ---
  {
    id: 'TC001',
    desc: '基础：画矩形',
    canvasState: '画布为空',
    history: [],
    input: '画一个矩形',
    expect: { type: 'execute', mustContain: ['add_shape', 'rect'] }
  },
  {
    id: 'TC002',
    desc: '基础：画红色大圆在左上角',
    canvasState: '画布为空',
    history: [],
    input: '在左上角画一个红色大圆',
    expect: { type: 'execute', mustContain: ['ellipse', '#FF4444'], xRange: [50, 300], yRange: [50, 250] }
  },
  {
    id: 'TC003',
    desc: '基础：连接两个图形',
    canvasState: '画布元素：[rect_001:矩形@(100,200),蓝色,120x60] [rect_002:矩形@(500,200),绿色,120x60]',
    history: [],
    input: '用箭头连接左边的方块和右边的方块',
    expect: { type: 'execute', mustContain: ['add_arrow', 'rect_001', 'rect_002'] }
  },

  // --- P0：上下文引用类 ---
  {
    id: 'TC004',
    desc: '上下文：代词引用"那个"',
    canvasState: '画布元素：[rect_001:矩形@(100,100),蓝色,120x60]',
    history: [
      { role: 'user', content: '画一个蓝色矩形' },
      { role: 'assistant', content: '{"type":"execute","actions":[{"type":"add_shape","id":"rect_001"...}],"confirmMessage":"已添加蓝色矩形"}' }
    ],
    input: '把那个变成红色',
    expect: { type: 'execute', mustContain: ['modify_shape', 'rect_001', '#FF4444'] }
  },
  {
    id: 'TC005',
    desc: '上下文：位置代词"左边的"',
    canvasState: '画布元素：[rect_001:矩形@(100,200),蓝色] [rect_002:矩形@(500,200),绿色]',
    history: [],
    input: '删除左边的矩形',
    expect: { type: 'execute', mustContain: ['delete_shape', 'rect_001'] }
  },

  // --- P1：澄清类 ---
  {
    id: 'TC006',
    desc: '澄清：纯评价性语言',
    canvasState: '画布元素：[rect_001:矩形@(100,100),蓝色] [rect_002:矩形@(110,110),绿色]',
    history: [],
    input: '感觉不好看',
    expect: { type: 'clarify', mustHaveOptions: true, minOptions: 2 }
  },
  {
    id: 'TC007',
    desc: '澄清：代词歧义（多个同类元素）',
    canvasState: '画布元素：[rect_001:矩形@(100,100),蓝色] [rect_002:矩形@(400,100),绿色] [rect_003:矩形@(700,100),红色]',
    history: [],
    input: '把那个矩形变大',
    expect: { type: 'clarify', mustHaveOptions: true }
  },

  // --- 边界类 ---
  {
    id: 'TC008',
    desc: '边界：画布为空时说删除',
    canvasState: '画布为空',
    history: [],
    input: '删除那个圆',
    expect: { type: 'clarify' }  // 不应该返回execute
  },
  {
    id: 'TC009',
    desc: '边界：一句话多个操作',
    canvasState: '画布为空',
    history: [],
    input: '画一个红色矩形，再画一个蓝色圆，用箭头连起来',
    expect: { type: 'execute', minActionsCount: 3 }
  },
  {
    id: 'TC010',
    desc: '边界：带标签的图形',
    canvasState: '画布为空',
    history: [],
    input: '画一个矩形，里面写"用户登录"',
    expect: { type: 'execute', mustContain: ['用户登录'] }
  }
];
```

---

## 实现要求

### 1. promptBuilder.js
完整实现上方的三个导出函数，不得改变函数签名：
- `buildSystemPrompt()` → 返回string
- `buildUserMessage(canvasState, conversationHistory, userInput)` → 返回string
- `buildMessages(canvasState, conversationHistory, userInput)` → 返回messages数组

### 2. promptValidator.js
完整实现上方的验证函数，用于开发调试，不导出到生产bundle。

### 3. promptTestCases.js
完整实现测试用例集，并额外实现一个运行函数：
```javascript
export async function runTestCase(testCaseId, claudeApiCaller) {
  const tc = TEST_CASES.find(t => t.id === testCaseId);
  if (!tc) { console.error('找不到用例', testCaseId); return; }
  
  console.log(`\n=== 运行测试用例 ${tc.id}：${tc.desc} ===`);
  console.log('输入：', tc.input);
  console.log('画布状态：', tc.canvasState);
  
  const result = await claudeApiCaller(tc.canvasState, tc.history, tc.input);
  
  console.log('AI返回：', JSON.stringify(result, null, 2));
  
  // 自动验证
  const pass = tc.expect.type === result.type;
  console.log(pass ? `✅ 类型正确（${result.type}）` : `❌ 类型错误，期望${tc.expect.type}，实际${result.type}`);
  
  if (tc.expect.mustContain) {
    const resultStr = JSON.stringify(result);
    tc.expect.mustContain.forEach(keyword => {
      const ok = resultStr.includes(keyword);
      console.log(ok ? `✅ 包含关键字：${keyword}` : `❌ 缺少关键字：${keyword}`);
    });
  }
  
  return result;
}
```

### 4. 集成到 useCommandProcessor.js

在 `useCommandProcessor.js` 中使用 `promptBuilder.js`：
```javascript
import { buildSystemPrompt, buildMessages } from '../utils/promptBuilder';
import { serializeCanvas } from '../utils/canvasSerializer';

// 调用Claude API时：
const systemPrompt = buildSystemPrompt();
const canvasState = serializeCanvas(currentElements);
const messages = buildMessages(canvasState, conversationHistory, userInput);

// POST /api/chat 时传入：
{
  system: systemPrompt,
  messages: messages,
  userApiKey: sessionStorage.getItem('userApiKey') || ''
}
```

---

## 验收标准

开发完成后，请在浏览器控制台运行以下验证：

```javascript
// 1. 结构检查
import { validatePromptQuality } from './utils/promptValidator';
validatePromptQuality();
// 期望：所有检查✅，token估算<1000

// 2. 手动跑测试用例（需要真实API连通后）
import { runTestCase } from './utils/promptTestCases';
// 至少跑 TC001、TC004、TC006、TC008 这4个核心用例
// TC001、TC004 必须返回 execute
// TC006、TC008 必须返回 clarify
```

**Day 1 Prompt层验收标准：**
- `validatePromptQuality()` 全部✅
- TC001（基础画图）通过
- TC004（上下文引用）通过
- TC006（模糊指令澄清）通过

**Day 2 Prompt层验收标准：**
- TC001-TC010 全部通过
- 30个画布元素时token估算仍 < 1000
