const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition
} = require("docx");

// ── 通用样式 ──
const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const headerShading = { fill: "1A3A5C", type: ShadingType.CLEAR };
const headerText = (text, width) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: headerShading,
  margins: cellMargins,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })]
});
const cell = (text, width, opts = {}) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
  margins: cellMargins,
  children: [new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 20, bold: !!opts.bold, color: opts.color || "333333" })]
  })]
});
const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 60 },
  children: [new TextRun({ text, font: "Arial", size: 22, color: "333333" })]
});
const bodyText = (text) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, font: "Arial", size: 22, color: "333333" })]
});
const subHeading = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: "1A3A5C" })]
});
const subSubHeading = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: "2B5A8C" })]
});

// ── 便捷创建表格 ──
function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => headerText(h, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((c, ci) => cell(c, colWidths[ci], { shading: ri % 2 === 0 ? "F7F9FC" : "FFFFFF" }))
      }))
    ]
  });
}

// ═══════════════════════════════════════════
// 第一部分：Canva AI / Adobe Firefly 语音控制
// ═══════════════════════════════════════════
const part1 = [
  new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "第一部分：Canva AI / Adobe Firefly 语音控制现状", font: "Arial", size: 32, bold: true, color: "1A3A5C" })] }),
  bodyText("分析日期：2026年6月12日 | 分析深度：深度研究"),
  bodyText(""),

  subHeading("1.1 执行摘要"),
  bodyText("Canva 与 Adobe 是全球设计工具市场的两大核心玩家。截至2026年中，两家公司在 AI 语音控制方面的进展差距显著：Canva AI 2.0 已将语音输入深度整合到设计工作流中，支持多轮对话式设计；而 Adobe Firefly 在语音→图像/设计方向上几乎是空白，其语音能力主要集中在音频生成（TTS/音效）方向。两家的差距约为1-2年。"),
  bodyText(""),

  subHeading("1.2 Canva AI 语音能力深度分析"),

  subSubHeading("1.2.1 产品演进时间线"),
  bodyText("Canva 在语音+AI设计领域的布局分两步走："),
  bodyText("2025年4月（Canva Create 2025）：首次发布语音启用的对话式 AI 工具。用户可通过语音或文字提示生成文本、幻灯片、图像、编辑照片和调整设计尺寸。这是 Canva 首次将语音输入引入设计流程。"),
  bodyText("2026年4月（Canva Create 2026）：发布 Canva AI 2.0，CEO Melanie Perkins 称之为自2013年以来最大的产品升级。核心是\"对话式设计\"——AI 从头脑风暴到细节润色全程陪伴，支持语音和文字双模输入。"),
  bodyText(""),

  subSubHeading("1.2.2 语音功能清单"),
];

// Canva 语音功能表格
part1.push(
  makeTable(
    ["功能模块", "具体功能", "详细说明"],
    [
      ["语音输入入口", "麦克风图标", "Canva AI 界面内嵌麦克风按钮，点击即可语音输入，无需打字"],
      ["语音输入入口", "18+语言支持", "涵盖中英日韩法德西葡阿拉伯等18种以上语言"],
      ["语音输入入口", "模糊输入理解", "接受语音消息、文字、甚至粗略草图作为设计意图输入"],
      ["对话式设计", "多轮语音对话", "AI 保持整个设计过程的上下文，支持连续语音交流和迭代优化"],
      ["对话式设计", "自然语言意图描述", "用语音描述想创建的内容场景（如\"创建一个推广最新播客的高能量社交帖子\"）"],
      ["对话式设计", "内容类型选择", "语音输入后可选择 Design / Image / Doc / Code / Video clip 等输出类型"],
      ["智能体编排", "一线生成多格式", "一句语音提示自动生成 Instagram 帖子、Stories、YouTube 缩略图、Email 等多渠道素材"],
      ["智能体编排", "跨应用编排", "Connectors 连接 Slack/Zoom/Gmail 等，语音指令可引用真实数据"],
      ["智能体编排", "定时任务", "语音设置周期性任务（如\"每周一从Gmail摘要生成周报\"）"],
      ["精确编辑", "基于对象的编辑", "语音指令仅修改指定元素（如\"把这个标题字体加粗\"），不变更其他内容"],
      ["精确编辑", "图层级控制", "可语音对单个图层进行颜色、大小、位置等精细化调整"],
      ["持久记忆", "风格学习", "AI 学习用户品牌风格、偏好，越用越个性化的语音响应"],
    ],
    [2000, 1800, 5560]
  )
);

part1.push(
  bodyText(""),
  subSubHeading("1.2.3 底层技术架构"),
  bodyText("Canva AI 2.0 的语音能力并非简单的\"语音转文字→调用LLM\"管道，而是自研的多模态基础模型："),
  bullet("CORE 研究团队（100+ 研究员）自研多模态基础模型，将语音理解与设计生成原生融合"),
  bullet("推理速度比同等前沿模型快 7 倍，成本低 30 倍"),
  bullet("支持对象级智能编辑，可识别设计元素的语义边界"),
  bullet("持久记忆库存储用户风格偏好，驱动个性化语音响应"),
  bodyText(""),

  subSubHeading("1.2.4 定价与可用性"),
  bodyText("Canva 定价分为四档：Free（$0）、Pro（$14.99/月或$119.99/年）、Teams（$29.99/月/5人）、Enterprise（定制报价）。AI 功能消耗 AI credits，Pro 以上套餐享有完整 Canva AI 2.0 使用权限。语音功能目前处于研究预览阶段，优先向首批100万用户推送，然后逐步全球扩展。"),
  bodyText(""),

  subSubHeading("1.2.5 SWOT 分析 — Canva AI 语音控制"),
);

// Canva SWOT
part1.push(
  makeTable(
    ["维度", "分析"],
    [
      ["优势 (S)", "1. 语音与设计工作流深度原生集成，非第三方拼接\n2. 多轮对话保持完整设计上下文，支持迭代优化\n3. 自研多模态模型，速度快7倍、成本低30倍\n4. 2.65亿+用户基础，数据飞轮效应显著\n5. 基于对象的精确语音编辑，解决\"全量重生成\"痛点"],
      ["劣势 (W)", "1. 语音功能仍处于研究预览阶段，未全面开放\n2. 语音可能依赖安静环境，噪声场景下准确性未知\n3. 没有真正的语音对话模式（AI不\"说\"回来，只有文字/视觉反馈）\n4. 专业设计师群体渗透率低，被认为\"非专业工具\""],
      ["机会 (O)", "1. 无障碍设计市场巨大——肢体障碍用户可通过语音完成专业设计\n2. 移动端语音设计场景（通勤、散步时口述设计想法）\n3. 品牌自动化的企业需求（语音命令批量生成素材）\n4. 教育市场（学生通过语音学习设计）"],
      ["威胁 (T)", "1. Adobe 拥有专业创作者生态壁垒，一旦补齐语音短板威胁大\n2. 开源社区（Excalidraw+AI等）可能以更低成本实现类似能力\n3. AI 生成内容的版权问题持续发酵\n4. 用户隐私顾虑（语音数据收集与训练）"],
    ],
    [1500, 7860]
  )
);

part1.push(
  bodyText(""),
  subHeading("1.3 Adobe Firefly 语音能力深度分析"),

  subSubHeading("1.3.1 产品现状"),
  bodyText("Adobe Firefly 目前没有语音→图像/设计的能力。其语音相关功能集中在音频生成方向："),
);

part1.push(
  makeTable(
    ["功能", "类型", "状态", "说明"],
    [
      ["Generate Speech", "TTS（文字→语音）", "公开Beta", "Firefly Speech Model + ElevenLabs，生成旁白配音"],
      ["Voice-to-Sound Effects", "语音→音效", "已上线", "用声音引导生成音效，属于音频创作工具"],
      ["Generate Soundtrack", "文字→配乐", "公开Beta", "AI 生成免版税配乐，自动对齐视频时长"],
      ["Enhance Speech", "音频增强", "已上线", "从 Premiere Pro 迁移至 Firefly 视频编辑器"],
      ["Firefly AI Assistant", "对话式智能体", "Beta (2026.4)", "纯文字自然语言交互，编排跨应用工作流，暂无语音输入"],
    ],
    [2500, 2000, 1800, 3060]
  )
);

part1.push(
  bodyText(""),
  subSubHeading("1.3.2 Firefly AI Assistant 详细分析（2026年4月发布）"),
  bodyText("这是 Adobe 在\"对话式设计\"方向的最大动作，原代号 Project Moonlight。核心能力："),
  bullet("统一对话界面：单个聊天线程跨会话保持上下文，可在 Photoshop/Premiere/Lightroom/Illustrator/Express 等应用中接力执行"),
  bullet("100+ 预制 Creative Skills：人像修图、社交媒体素材生成等多步工作流模板"),
  bullet("Frame.io 集成：AI 可解读利益相关者的反馈并自动应用修改"),
  bullet("第三方集成：正在开发接入 Anthropic Claude 等第三方 AI 界面的轻量版"),
  bullet("Project Graph：节点式可视化工作流构建器（开发中），支持团队共享可复用胶囊"),
  bodyText("关键局限：Firefly AI Assistant 目前仅支持文字输入，没有语音入口。Adobe 在语音交互方面的滞后与 Canva 形成鲜明对比。"),
  bodyText(""),

  subSubHeading("1.3.3 技术路线对比"),
  bodyText("Adobe 采取的策略与 Canva 有根本性不同："),
  bullet("Adobe：AI 作为现有专业工具的编排层——让 AI 操作 Photoshop/Premiere 等工具，而非替代它们"),
  bullet("Canva：AI 原生嵌入平台——从设计生成到编辑都在统一的 AI 对话界面中完成"),
  bullet("语音投入方向：Adobe → 音频生成和增强（TTS/音效/配乐）；Canva → 语音作为输入模态驱动设计生成"),
  bodyText(""),

  subSubHeading("1.3.4 SWOT 分析 — Adobe Firefly 语音控制"),
);

// Adobe SWOT
part1.push(
  makeTable(
    ["维度", "分析"],
    [
      ["优势 (S)", "1. 拥有 Photoshop/Premiere/Illustrator 等全球最强大的专业创作工具链\n2. Firefly AI Assistant 的跨应用编排能力设计理念先进\n3. 30+ 第三方 AI 模型集成（OpenAI/Google/Runway 等）\n4. 8亿+ Adobe Stock 授权素材库\n5. Content Credentials 内容溯源机制，商业安全性高"],
      ["劣势 (W)", "1. 语音→设计/图像方向完全空白，落后 Canva 1-2年\n2. Firefly AI Assistant 无语音入口，纯文字交互\n3. 定价复杂——需多个 App SKU 订阅，生成消耗额外 Credits\n4. 语音方向资源投入在音频生成而非视觉生成"],
      ["机会 (O)", "1. Claude 集成可触达非 Adobe 生态用户\n2. NVIDIA 沙盒智能体基础设施可支撑长期运行的工作流\n3. 专业创作者对语音驱动高效工作流的潜在需求\n4. 自定义模型训练（Firefly Custom Models）可构建品牌级竞争壁垒"],
      ["威胁 (T)", "1. Canva AI 2.0 已在语音设计领域建立先发优势\n2. 开源社区以更低成本提供类似能力\n3. 专业用户可能抗拒语音交互模式（\"不专业\"的印象）\n4. AI 内容版权和训练数据合规风险"],
    ],
    [1500, 7860]
  )
);

part1.push(
  bodyText(""),
  subHeading("1.4 Canva vs Adobe 语音能力对比矩阵"),
);

part1.push(
  makeTable(
    ["对比维度", "Canva AI 2.0", "Adobe Firefly", "差距"],
    [
      ["语音输入", "✅ 支持，界面内嵌麦克风", "❌ 不支持", "Canva 领先"],
      ["语音→图像生成", "✅ 语音描述生成可编辑设计", "❌ 不存在", "Canva 领先"],
      ["多轮语音对话", "✅ 保持设计上下文", "❌ 不存在（文字对话有）", "Canva 领先"],
      ["语音精确编辑", "✅ 图层级语音指令修改", "❌ 不支持", "Canva 领先"],
      ["语音→多格式输出", "✅ 语音提示跨格式生成", "❌ 不支持（文字有）", "Canva 领先"],
      ["多语言语音", "✅ 18+语言", "❌ 不适用", "Canva 领先"],
      ["跨应用编排", "✅ Connectors（Slack/Zoom等）", "✅ 跨 Creative Cloud 编排", "持平"],
      ["语音→音频生成", "❌ 不适用", "✅ TTS/音效/配乐", "Adobe 领先"],
      ["专业工具深度", "一般（偏模板化）", "极深（PS/PR/AI等）", "Adobe 领先"],
      ["定价友好度", "高（$14.99/月起）", "低（需多SKU订阅）", "Canva 领先"],
    ],
    [2200, 2500, 2500, 2160]
  )
);

part1.push(
  bodyText(""),
  subHeading("1.5 关键结论"),
  bullet("差距确认：在\"语音控制设计/绘图\"领域，Canva AI 2.0 领先 Adobe Firefly 约 1-2 年。Adobe 在语音能力的投资偏向音频生成方向"),
  bullet("战略差异：Canva 走\"AI原生+语音驱动\"路线，Adobe 走\"AI编排专业工具\"路线。前者的语音集成更自然，后者的工具深度更高"),
  bullet("市场窗口：Adobe 若在1年内补齐语音短板，可利用专业工具生态反超。但在此之前，Canva 在语音设计领域几乎无直接竞争"),
  bullet("核心机会：无论 Canva 还是 Adobe，当前都没有\"语音自由绘图\"能力——语音只能描述设计意图让AI生成，不能像人手一样逐步绘制、精细控制。这为第三方工具留下了机会窗口"),
  bodyText(""),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "[来源：Canva Create 2026发布会、Canva官方帮助中心、Adobe MAX 2025发布会、Adobe官方博客、Firefly AI Assistant Beta公告、TechCrunch测评、Ars Technica分析]", font: "Arial", size: 18, color: "888888", italics: true })] }),
);

// ═══════════════════════════════════════════
// 第二部分：纯语音绘图产品市场空白分析
// ═══════════════════════════════════════════
const part2 = [
  new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "第二部分：纯语音绘图产品市场空白分析", font: "Arial", size: 32, bold: true, color: "1A3A5C" })] }),
  bodyText("分析日期：2026年6月12日 | 分析深度：深度研究"),
  bodyText(""),

  subHeading("2.1 核心判断"),
  bodyText("\"纯语音绘图\"——即用户仅通过语音指令，逐步绘制、精确控制、自由修改画布上的内容——在2026年6月这个时间点，是一个基本空白的市场。现有产品要么停留在\"声音→抽象可视化\"层面，要么处于 Hackathon 原型阶段。没有任何商业化产品能实现\"用语音一句一句描述、逐步修改、最终画出精确的图\"的完整闭环。"),
  bodyText(""),

  subHeading("2.2 现有产品全景扫描"),

  subSubHeading("2.2.1 商业上架产品"),
];

part2.push(
  makeTable(
    ["产品", "平台", "核心机制", "语音能力深度", "状态"],
    [
      ["Aurio Art", "iOS/macOS (Apple Silicon)", "语音→实时3D雕塑/粒子/波浪/螺旋，多种视觉模式", "声音可视化（频率/音调/节奏→形状），非\"绘图\"", "免费，已上架"],
      ["Voices - paint with your voice", "iOS", "声音→绘画", "声音可视化", "免费，已上架"],
      ["Qonqur", "iPad/Mac/Vision Pro", "AI手写+绘画理解，语音搜索和交互，AI解读草图", "语音搜索+AI理解，非语音绘图工具", "免费+内购($9.99)"],
      ["马良AI画板", "Android", "AI画板", "不详", "已上架"],
    ],
    [1800, 2000, 3260, 1500, 800]
  )
);

part2.push(
  bodyText(""),
  subSubHeading("2.2.2 Hackathon 原型项目"),
);

part2.push(
  makeTable(
    ["项目", "平台", "技术栈", "核心创新", "局限"],
    [
      ["Voice Canvas", "Devpost (2025)", "React+Vite+Express, Whisper API, pitchy库", "哼唱/音高控制画笔移动 + 语音命令变色/改笔刷 + 彩虹模式（频谱图效果）", "抽象可视化，无法绘制结构化图形；无形状命令"],
      ["VocalCanvas", "Devpost (2025)", "Next.js+React+Konva, Google Gemini, WebSockets, FastAPI, Firestore", "\"画一个红色圆形\"→生成形状；支持\"删除左边的那个\"上下文指令；画布状态发给AI理解", "仅支持预设形状，无法自由曲线；命令理解依赖提示工程"],
      ["Echo Canvas", "lablab.ai AI Genesis Hackathon (2025.11)", "AI语音→艺术平台", "检测情感语调和无障碍需求；AI生成音频描述供视障用户\"听\"到作品", "更偏向艺术表达+无障碍，非精确绘图"],
      ["Speak2Scene", "SoftwareX学术论文 (2026.6)", "GPT-4o + GPT-image-1", "语音→故事板图像生成；为上肢障碍用户设计；开源可部署", "生成图像而非可编辑矢量图；无逐笔操控"],
    ],
    [1600, 1800, 2600, 2000, 1360]
  )
);

part2.push(
  bodyText(""),
  subSubHeading("2.2.3 学术研究项目"),
  bodyText("在 HCI（人机交互）和无障碍计算领域，2025-2026年出现了多项相关研究："),
  bullet("包容性语音交互技术（Universal Access in the Information Society, 2025）：首个针对肢体障碍用户的语音控制2D图形旋转研究。测试了三种方法（基线旋转/固定跳跃/动画旋转），动画旋转被证明最高效。12-25名残障参与者均能仅用语音完成旋转任务。"),
  bullet("多模态无障碍绘图系统（IEEE CAI 2025）：结合手势+语音的虚拟绘图系统。MediaPipe 手势识别 => 空中绘制/擦除/投影；SpeechRecognition 语音处理 => 命令控制。支持残障和低视力用户。"),
  bullet("Google TDCommons 技术披露（2025.9）：GenAI + 眼动追踪 + 物理开关 + MIDI控制器 + 语音 → 多模态实时绘图。Web版和GPU版两种实现，支持凝视选区域+语音描述内容+凝视确认操作。"),
  bullet("Springer HCI 综合系统（2025）：手势+印度手语+AI语音机器人，94.8%手势检测准确率，91.2%ISL翻译准确率。"),

  bodyText(""),
  subHeading("2.3 市场空白深度分析"),

  subSubHeading("2.3.1 空白的三个层次"),
  bodyText("第一层——声音可视化产品：存在。Aurio Art、Voices 等将声音转为抽象视觉形态（粒子/波浪/3D雕塑）。这些不是\"绘图工具\"。"),
  bodyText("第二层——语音命令生成预设图形：存在原型。VocalCanvas 能执行\"画一个红色圆形\"类指令，但仅限预设形状，无法自由绘制。Voice Canvas 能通过哼唱控制画笔，但无法生成结构化内容。"),
  bodyText("第三层——语音自由精确绘图：不存在。能理解\"在画布左边画一个房子、在房子右边加一棵树、把太阳涂成橙黄色、这棵树太大了缩小30%\"并逐步精确执行的工具，在全球范围内没有商业化产品。"),
  bodyText(""),

  subSubHeading("2.3.2 为什么是空白？——技术栈瓶颈分析"),
  bullet("实时语音识别精度：绘图场景需要极低延迟的语音识别（\"停\"这个词必须在200ms内响应），且需要区分\"描述内容\"和\"操作指令\"。通用ASR引擎（Whisper等）的延迟和精度无法满足。"),
  bullet("空间语义理解：\"在左边画一个圆\"需要 AI 理解当前画布的坐标系、已有元素的位置关系、模糊空间描述（如\"旁边\"\"上面一点\"\"稍微大一点\"）的数学转换。这比\"生成一张图\"难得多。"),
  bullet("增量式编辑与状态管理：语音绘图需要 AI 维护一个持续变化的画布状态模型，每一步修改都要在既有基础上增量操作。当前主流 AI 图像模型都是 stateless 的（每次生成独立）。"),
  bullet("多模态意图消歧：\"把这个放到那里\"——需要结合语音、手势、眼动、画布上下文来消歧\"这个\"指什么、\"那里\"是哪里。单靠语音不足以实现精确操控。"),
  bullet("用户体验定义空白：纯语音绘图的交互范式没有先例可循。\"说多快？怎么纠错？怎么撤销？怎么缩放？\"这些基本交互模式需要从零发明。"),
  bodyText(""),

  subSubHeading("2.3.3 市场信号——需求存在"),
  bodyText("虽然没有产品，但需求信号清晰可见："),
  bullet("无障碍需求（最刚需）：全球约1.3亿上肢严重障碍人士。Speak2Scene 的用户研究显示，语音创作工具被描述为\"功能性强、鼓舞人心、带来快乐、激发跳出框框的思考\"。"),
  bullet("知识工作者效率需求：在头脑风暴/会议场景中用语音快速出草图。Qonqur 的市场验证证明了\"AI理解手绘+语音\"方向的需求。"),
  bullet("移动端设计需求：Canva 推出语音功能后用户反响积极，验证了\"不想打字时用语音做设计\"的场景。"),
  bullet("教育场景：残障教育、少儿编程教育中语音交互降低了设计/绘图的学习门槛。"),
  bodyText(""),

  subHeading("2.4 机会评估——市场进入窗口"),
  bodyText("这是一个\"技术可行、需求明确、竞争空白\"的三重机会窗口："),
  bullet("技术可行：2026年的 LLM（GPT-4o/Gemini/Claude）+ 实时语音 API + Canvas 渲染引擎 + Excalidraw MCP 生态 = 技术栈已经齐备"),
  bullet("需求明确：无障碍、知识工作、移动设计、教育四大场景都有付费意愿"),
  bullet("竞争空白：大厂（Canva/Adobe）聚焦\"语音生成完整设计\"而非\"语音逐步绘图\"；开源社区聚焦\"文字prompt驱动AI画图\"而非\"语音操控\"；创业公司停留在 Hackathon 原型"),
  bullet("窗口期预估：12-18个月。预计 Canva 或 Adobe 会在2年内将语音能力延伸到更精细的绘图控制，或在 Excalidraw 社区出现语音-MCP 的整合方案"),
  bodyText(""),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "[来源：Aurio Art App Store页面、Devpost Voice Canvas/VocalCanvas项目页、lablab.ai Echo Canvas项目、SoftwareX Speak2Scene论文、Universal Access in the Information Society期刊、IEEE CAI 2025论文集、Google TDCommons技术披露]", font: "Arial", size: 18, color: "888888", italics: true })] }),
);

// ═══════════════════════════════════════════
// 第三部分：Excalidraw + AI 集成开源项目
// ═══════════════════════════════════════════
const part3 = [
  new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "第三部分：Excalidraw + AI 集成开源项目深度分析", font: "Arial", size: 32, bold: true, color: "1A3A5C" })] }),
  bodyText("分析日期：2026年6月12日 | 分析深度：深度研究"),
  bodyText(""),

  subHeading("3.1 生态概述"),
  bodyText("截至2026年6月，Excalidraw + AI 集成是中国乃至全球开源社区最活跃的方向之一。核心驱动因素是 MCP（Model Context Protocol）的普及——它让 AI 助手（Claude Code、Cursor 等）获得了直接操控 Excalidraw 画布的能力。"),
  bodyText("整个生态可以分为两大阵营：官方 MCP（一键出图）和社区 MCP（编程式精细控制）。此外还有一个2026年新兴的\"Code Mode\"范式。"),
  bodyText(""),

  subHeading("3.2 项目全景列表"),

  subSubHeading("3.2.1 官方项目"),
];

part3.push(
  makeTable(
    ["项目", "GitHub Stars", "最近更新", "核心理念", "工具数"],
    [
      ["excalidraw/excalidraw-mcp\n(官方)", "~4,600", "2026.2 (v0.3.2)", "Prompt→Diagram 一键出图，流式渲染在聊天界面中", "1（单一生成）"],
    ],
    [2600, 1500, 1800, 2260, 1200]
  )
);

part3.push(
  bodyText(""),
  subSubHeading("3.2.2 社区项目"),
);

part3.push(
  makeTable(
    ["项目", "Stars/版本", "技术栈", "工具数", "核心差异化"],
    [
      ["@airmix/mcp-excalidraw-server", "v2.0", "Python FastMCP + TypeScript Express.js Canvas Server", "26", "功能最全：闭环反馈(画→截图→看→调)、Mermaid转换、快照/回滚、对齐分布、26个MCP工具"],
      ["agent-canvas (WHQ25)", "v0.13.0 (2026.3)", "CLI + Skill 模式", "CLI命令", "Token高效 (~50 token/元素，JSON需500+)、动画模式逐步观看构建、多画布切换"],
      ["excalidraw-toolkit (edwingao28)", "活跃", "NPM 脚手架", "7", "\"diagram this repo\"一键代码库可视化、6阶段自动流水线、自我审查+自动修复"],
      ["drawmode (teamchong)", "增长中", "TypeScript Code Mode", "N/A", "LLM写TypeScript代替JSON→50x token压缩、Graphviz自动布局"],
      ["excalidraw-skill (Agents365-ai)", "v1.3.0 (2026.6)", "Claude Code Skill", "N/A", "设计系统驱动(8色调色板/5级字体)、200+图标库、Kroki API导出、渲染-验证循环"],
      ["mcp-excalidraw-local (sanjibdevnath)", "v1.6.2", "Python MCP + SQLite", "32", "完全离线、SQLite持久化+版本控制+全文搜索、多租户工作区隔离"],
      ["excalidraw-mcp (lesleslie)", "活跃", "Python FastMCP + TS Canvas", "10+", "严格类型检查、WebSocket实时同步、多客户端"],
      ["excalidraw-mcp (celstnblacc/sentinel)", "小", "Python + SQLite", "32+", "生产级安全加固、446测试、Helmet安全、API Key认证"],
      ["ai-excalidraw (co-pine)", "活跃", "React 19 + Vite + Tailwind CSS v4", "N/A", "聊天框自然语言→图形、支持国内API(智谱/阿里百炼)、流式渲染"],
      ["SimpleExcalidraw (linkxzhou)", "活跃", "中文优化版", "N/A", "中文手写体、AI+Mermaid+动画播放(SVG+Web Animations API)"],
    ],
    [2700, 1300, 2200, 700, 2460]
  )
);

part3.push(
  bodyText(""),
  subHeading("3.3 技术架构对比分析"),

  subSubHeading("3.3.1 三种设计范式"),
  bodyText("范式一：Prompt-to-Diagram（官方 MCP）。用户描述意图 → MCP Server 一次性生成 Excalidraw 数据 → 聊天界面内流式渲染。优点是简单快速，缺点是无法迭代修改、不能增删元素。"),
  bodyText("范式二：Programmatic Element Control（@airmix、agent-canvas、mcp-excalidraw-local）。AI 通过编程式 API 逐个创建/修改/删除元素 → WebSocket 实时同步到浏览器画布 → 截图反馈给 AI → 迭代优化。优点是精细控制+闭环反馈，缺点是 token 消耗大。"),
  bodyText("范式三：Code-as-Compression（drawmode）。LLM 不直接输出 Excalidraw JSON，而是写 TypeScript 代码调用绘图 SDK → Graphviz 处理布局 → 编译执行生成图表。核心洞察：同样的图，代码比 JSON 省 50 倍 token。这是2026年最重要的技术创新。"),
  bodyText(""),

  subSubHeading("3.3.2 架构图——社区 MCP 典型架构"),
  bodyText("以 @airmix/mcp-excalidraw-server 为代表的主流架构："),
  bodyText("AI Agent (Claude) ←→ MCP Server (Python FastMCP) ←→ Canvas Server (Express.js) ←WebSocket→ React Frontend (Excalidraw)"),
  bodyText("关键数据流：1) AI 调用 MCP 工具创建元素 → 2) Python Server 生成 Excalidraw JSON → 3) Express.js 通过 WebSocket 推送给浏览器 → 4) 用户可同时在浏览器中手动编辑 → 5) AI 通过 get_canvas_screenshot 获得视觉反馈 → 6) AI 基于反馈继续修改"),
  bodyText(""),

  subSubHeading("3.3.3 Token 效率对比"),
);

part3.push(
  makeTable(
    ["方式", "50元素图Token消耗", "优势", "劣势"],
    [
      ["原始 Excalidraw JSON", "~25,000", "无，直接渲染", "token消耗巨大，LLM易出错"],
      ["drawmode Code Mode", "~500", "50x压缩，LLM写代码更擅长", "需要编译执行步骤"],
      ["agent-canvas CLI", "~2,500", "10x压缩，简洁的DSL", "表达能力有限"],
      ["@airmix MCP 工具", "~15,000-25,000", "精细控制，支持迭代", "token消耗大但可分批操作"],
    ],
    [2500, 2000, 2500, 2360]
  )
);

part3.push(
  bodyText(""),
  subHeading("3.4 功能完整度对比矩阵"),
);

part3.push(
  makeTable(
    ["功能维度", "官方 MCP", "@airmix", "agent-canvas", "drawmode", "mcp-local", "excalidraw-skill"],
    [
      ["元素 CRUD", "❌", "✅ 完整", "✅", "✅", "✅ 完整", "❌"],
      ["批量操作", "❌", "✅", "❌", "❌", "✅", "❌"],
      ["对齐/分布", "❌", "✅", "❌", "❌", "✅", "❌"],
      ["分组/解组", "❌", "✅", "❌", "❌", "✅", "❌"],
      ["Mermaid 转换", "❌", "✅", "❌", "❌", "✅", "✅"],
      ["画布截图反馈", "❌", "✅", "✅ (动画)", "❌", "✅", "✅ (PNG)"],
      ["快照/回滚", "❌", "✅", "❌", "❌", "✅ (SQLite)", "❌"],
      ["文件导入导出", "✅ (导出URL)", "✅ (.excalidraw)", "✅", "❌", "✅", "✅ (PNG/SVG)"],
      ["持久化存储", "❌ (无状态)", "❌", "❌", "❌", "✅ SQLite", "❌"],
      ["多画布", "❌", "❌", "✅", "❌", "✅ (多租户)", "❌"],
      ["实时协作", "❌", "✅ (WebSocket)", "❌", "❌", "✅ (WebSocket)", "❌"],
      ["设计系统/指南", "❌", "✅", "❌", "❌", "❌", "✅ 完整"],
      ["代码库可视化", "❌", "❌", "❌", "❌", "❌", "❌"],
      ["自我审查/修复", "❌", "❌", "❌", "❌", "❌", "✅"],
      ["离线运行", "❌ (需要网络)", "❌", "❌", "❌", "✅", "✅"],
      ["语音输入", "❌", "❌", "❌", "❌", "❌", "❌"],
      ["中文优化", "❌", "❌", "❌", "❌", "❌", "❌"],
    ],
    [2300, 1100, 1100, 1200, 1100, 1100, 1360]
  )
);

part3.push(
  bodyText(""),
  subSubHeading("3.4.1 核心发现"),
  bodyText("所有项目在\"语音输入\"这一列全部是 ❌。这是整个 Excalidraw MCP 生态的最大功能空白——尽管已有丰富的 AI 操控画布能力（26+工具），但输入方式100%依赖文字 prompt。"),
  bodyText(""),

  subHeading("3.5 社区生态与活跃度"),
  bullet("官方 MCP：4,600+ Stars，30天内增长369 Stars。有5个活跃PR和2个Issue。被集成到 Claude.ai / ChatGPT / VS Code 中。"),
  bullet("@airmix：37+ 评论，平均评分4.5/5。被 explainx.ai 等工具聚合平台推荐。"),
  bullet("中文社区：ruanyf/weekly #8973 期推荐、多个国内技术博客报道。ai-excalidraw 和 SimpleExcalidraw 专门针对中文用户优化。"),
  bullet("生产级趋势：excalidraw-mcp-sentinel 的出现标志着从\"能用\"到\"生产可用\"的演进。446个测试、安全加固、API Key 认证。"),
  bullet("2026年2-6月是活跃高峰：大部分项目的最新更新集中在此时段，说明生态正在快速升温。"),
  bodyText(""),

  subHeading("3.6 趋势判断与机会"),
  bodyText(""),
  subSubHeading("3.6.1 即将融合的三个方向"),
  bullet("Code Mode 将成为主流：drawmode 的 TypeScript 方案已经验证了 token 效率的质变。预计更多 MCP Server 会采纳类似方案，LLM 写代码而非 JSON。"),
  bullet("闭环反馈将成为标配：@airmix 和 excalidraw-skill 的\"画→看→调→再看\"循环，已被证明是提升图表质量的必要机制。静态一次性生成将被淘汰。"),
  bullet("语音+Excalidraw MCP = 下一代互动模式：生态中 100% 的项目都没有语音输入。将语音识别 + LLM 理解 + Excalidraw MCP 工具链串联起来，就能打造第一个真正的\"语音绘图\"产品。技术上完全可行——实时语音 API（如 OpenAI Realtime）+ MCP Server + WebSocket 画布同步，三步即可打通。"),
  bodyText(""),

  subSubHeading("3.6.2 项目推荐矩阵"),
);

part3.push(
  makeTable(
    ["场景", "推荐项目", "理由"],
    [
      ["快速一图流", "官方 excalidraw-mcp", "零配置，Prompt→图，4.6k Stars"],
      ["精细迭代绘图", "@airmix/mcp-excalidraw-server", "26工具+闭环反馈，目前功能最全"],
      ["Token预算紧张", "agent-canvas 或 drawmode", "50-100x token压缩"],
      ["代码库自动可视化", "excalidraw-toolkit", "\"diagram this repo\" 六个阶段全自动"],
      ["完全离线", "mcp-excalidraw-local", "SQLite + 32工具 + 零网络依赖"],
      ["中文场景", "ai-excalidraw 或 SimpleExcalidraw", "中文UI/手写体/国内API支持"],
      ["生产部署", "excalidraw-mcp-sentinel", "446测试+安全加固+多租户"],
      ["设计系统生成", "excalidraw-skill", "200+图标库+语义调色板+Kroki导出"],
    ],
    [2000, 3000, 4360]
  )
);

part3.push(
  bodyText(""),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "[来源：GitHub excalidraw/excalidraw-mcp、yctimlin/mcp_excalidraw、WHQ25/agent-canvas、edwingao28/excalidraw-toolkit、teamchong/drawmode、Agents365-ai/excalidraw-skill、co-pine/ai-excalidraw、linkxzhou/SimpleExcalidraw、celstnblacc/excalidraw-mcp-sentinel、lesleslie/excalidraw-mcp。npmjs.com @airmix/mcp-excalidraw-server、@sanjibdevnath/mcp-excalidraw-local。DevelopersIO、explainx.ai 评测文章。]", font: "Arial", size: 18, color: "888888", italics: true })] }),
);

// ═══════════════════════════════════════════
// 第四部分：综合结论与建议
// ═══════════════════════════════════════════
const part4 = [
  new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "第四部分：综合结论与战略建议", font: "Arial", size: 32, bold: true, color: "1A3A5C" })] }),
  bodyText(""),

  subHeading("4.1 三个核心结论"),
  bodyText("结论一：语音控制设计领域，Canva 领先 Adobe 1-2年。Canva AI 2.0 实现了从语音输入到对话式设计再到精确编辑的完整链路，而 Adobe Firefly 的语音能力几乎全部在音频生成方向，在设计/图像生成侧属于空白。"),
  bodyText(""),
  bodyText("结论二：纯语音绘图是一个确认的蓝海市场。现有所有产品要么停留在\"声音→抽象可视化\"，要么是 Hackathon 原型。能理解空间语义、支持增量编辑、逐步精确绘制的语音绘图工具——全球范围内不存在商业化产品。技术栈已齐备（2026年的 LLM + 实时语音 API + Canvas 引擎 + MCP 生态），需求信号清晰（无障碍、知识工作、移动设计、教育）。窗口期预估12-18个月。"),
  bodyText(""),
  bodyText("结论三：Excalidraw + AI 开源生态是语音绘图的最佳技术基座。社区已提供26-32个 MCP 工具操控画布、闭环反馈机制、WebSocket 实时同步、设计系统和图标库。唯一缺失的是语音输入模块——而这是最容易补齐的一环。\"语音识别 API → LLM 理解绘图意图 → Excalidraw MCP 工具调用\"这个链路，技术上完全可行。"),
  bodyText(""),

  subHeading("4.2 战略建议——如果要做语音绘图产品"),
  bodyText("建议一：基于 Excalidraw + MCP 生态构建，而非从零造轮子。社区已有成熟的画布操控层（20+ MCP 工具），聚焦在\"语音理解→画布意图映射\"这一核心差异点上。"),
  bodyText("建议二：从无障碍场景切入。这是最刚需的场景（1.3亿上肢障碍人士），且竞品最少。Speak2Scene 的用户反馈已经验证了该场景的情感价值（\"功能性强、鼓舞人心、带来快乐\"）。无障碍市场还有个好处：容易获得 grants 和公益基金支持。"),
  bodyText("建议三：采用多模态互补而非纯语音。Google TDCommons 的研究已经证明——凝视选位置+语音描述内容+简单手势确认，比纯语音高效得多。纯语音在空间定位上有天然局限，多模态融合是最优解。"),
  bodyText("建议四：抓紧12-18个月窗口期。Canva 或 Adobe 大概率会在2年内将语音能力延伸到更精细的绘图控制层面。Excalidraw 社区也可能自发出现语音-MCP 整合。"),
  bodyText(""),

  subHeading("4.3 风险提示"),
  bullet("大厂挤压风险：Canva/Adobe 若在12个月内补齐语音绘图能力，将凭借用户基数和生态优势碾压新进入者"),
  bullet("技术路线风险：OpenAI/Gemini 等基础模型可能在原生多模态中加入\"语音直接生成可编辑矢量图\"能力，从根本上改变竞争格局"),
  bullet("用户习惯风险：语音绘图是完全新的交互范式，用户教育和采纳曲线可能比预期慢"),
  bullet("商业模式风险：若基于开源 Excalidraw MCP 生态构建，如何在开源基础上建立商业壁垒需要仔细设计"),
  bodyText(""),

  subHeading("4.4 来源清单总览"),
];

part4.push(
  makeTable(
    ["来源", "类型", "可信度", "URL/来源"],
    [
      ["Canva Create 2026 发布会", "[官方]", "高", "canva.com 官方新闻稿"],
      ["Canva 官方帮助中心", "[官方]", "高", "canva.com/help/using-canva-ai/"],
      ["Canva AI 2.0 媒体测评", "[评测]", "中高", "Gadgets360, BusinessWorld, LBBOnline, 极客公园, PCOnline"],
      ["Canva 定价页面", "[官方]", "高", "canva.com/pricing, Vendr.com 交易数据"],
      ["Adobe MAX 2025 发布会", "[官方]", "高", "news.adobe.com 新闻稿"],
      ["Firefly AI Assistant Beta 公告", "[官方]", "高", "blog.adobe.com, 2026.4.15"],
      ["Adobe Firefly 媒体分析", "[评测]", "中高", "TechCrunch, Ars Technica, VentureBeat, Axios, The Next Web"],
      ["Aurio Art App Store", "[官方]", "高", "apps.apple.com"],
      ["Voice Canvas Devpost", "[用户反馈]", "中", "devpost.com/software/voice-canvas"],
      ["VocalCanvas Devpost", "[用户反馈]", "中", "devpost.com/software/vocalcanvas"],
      ["Speak2Scene 学术论文", "[官方]", "高", "SoftwareX (Elsevier), 2026.6"],
      ["语音交互无障碍研究", "[官方]", "高", "Universal Access in the Information Society (Springer), 2025"],
      ["Google TDCommons 技术披露", "[官方]", "高", "tdcommons.org, 2025.9"],
      ["Excalidraw MCP 官方仓库", "[官方]", "高", "github.com/excalidraw/excalidraw-mcp"],
      ["@airmix mcp-excalidraw-server", "[官方]", "高", "npmjs.com/package/@airmix/mcp-excalidraw-server"],
      ["Agent Canvas", "[官方]", "高", "github.com/WHQ25/agent-canvas"],
      ["Excalidraw Toolkit", "[官方]", "高", "github.com/edwingao28/excalidraw-toolkit"],
      ["Drawmode", "[官方]", "高", "github.com/teamchong/drawmode"],
      ["Excalidraw Skill", "[官方]", "高", "github.com/Agents365-ai/excalidraw-skill"],
      ["MCP Excalidraw Local", "[官方]", "高", "npmjs.com/package/@sanjibdevnath/mcp-excalidraw-local"],
      ["AI Excalidraw 中文版", "[官方]", "高", "github.com/co-pine/ai-excalidraw"],
      ["SimpleExcalidraw", "[官方]", "高", "github.com/linkxzhou/SimpleExcalidraw"],
      ["Excalidraw MCP 社区评测", "[评测]", "中", "DevelopersIO, explainx.ai, aibars.net"],
    ],
    [3200, 800, 800, 4560]
  )
);

// ═══════════════════════════════════════════
// 组装文档
// ═══════════════════════════════════════════
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1A3A5C" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1A3A5C" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2B5A8C" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "语音AI绘图工具竞品深度研究报告", font: "Arial", size: 16, color: "999999", italics: true })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "- ", font: "Arial", size: 16, color: "999999" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
            new TextRun({ text: " -", font: "Arial", size: 16, color: "999999" }),
          ]
        })]
      })
    },
    children: [
      // ── 封面 ──
      new Paragraph({ spacing: { before: 3600 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "语音AI绘图工具", font: "Arial", size: 52, bold: true, color: "1A3A5C" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "竞品深度研究报告", font: "Arial", size: 52, bold: true, color: "1A3A5C" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "—— Canva AI / Adobe Firefly 语音控制 · 纯语音绘图市场 · Excalidraw+AI 开源生态 ——", font: "Arial", size: 20, color: "888888" })]
      }),
      new Paragraph({ spacing: { before: 600 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "分析模式：深度研究（5000+字）", font: "Arial", size: 22, color: "555555" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "分析日期：2026年6月12日", font: "Arial", size: 22, color: "555555" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "覆盖竞品：Canva AI 2.0 / Adobe Firefly / Aurio Art / Voice Canvas / VocalCanvas / Speak2Scene / Excalidraw MCP 等 20+ 项目", font: "Arial", size: 20, color: "999999" })]
      }),
      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── 目录占位 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "目录", font: "Arial", size: 32, bold: true, color: "1A3A5C" })] }),
      bodyText("第一部分：Canva AI / Adobe Firefly 语音控制现状"),
      bodyText("  1.1 执行摘要"),
      bodyText("  1.2 Canva AI 语音能力深度分析"),
      bodyText("  1.3 Adobe Firefly 语音能力深度分析"),
      bodyText("  1.4 Canva vs Adobe 语音能力对比矩阵"),
      bodyText("  1.5 关键结论"),
      bodyText("第二部分：纯语音绘图产品市场空白分析"),
      bodyText("  2.1 核心判断"),
      bodyText("  2.2 现有产品全景扫描"),
      bodyText("  2.3 市场空白深度分析"),
      bodyText("  2.4 机会评估——市场进入窗口"),
      bodyText("第三部分：Excalidraw + AI 集成开源项目深度分析"),
      bodyText("  3.1 生态概述"),
      bodyText("  3.2 项目全景列表"),
      bodyText("  3.3 技术架构对比分析"),
      bodyText("  3.4 功能完整度对比矩阵"),
      bodyText("  3.5 社区生态与活跃度"),
      bodyText("  3.6 趋势判断与机会"),
      bodyText("第四部分：综合结论与战略建议"),
      bodyText("  4.1 三个核心结论"),
      bodyText("  4.2 战略建议"),
      bodyText("  4.3 风险提示"),
      bodyText("  4.4 来源清单总览"),

      // ── 四部分内容 ──
      ...part1,
      ...part2,
      ...part3,
      ...part4,
    ]
  }]
});

// ── 生成文件 ──
const outputPath = "/Users/zhangyuxiang/Downloads/语音AI绘图工具竞品深度研究报告.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("报告已生成: " + outputPath);
}).catch(err => {
  console.error("生成失败:", err);
});
