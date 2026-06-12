const COLOR_MAP = {
  '#ff4444': '红色', '#FF4444': '红色',
  '#cc0000': '深红', '#CC0000': '深红',
  '#ff69b4': '粉色', '#FF69B4': '粉色',
  '#4a90d9': '蓝色', '#4A90D9': '蓝色',
  '#1e3a8a': '深蓝', '#1E3A8A': '深蓝',
  '#06b6d4': '青色', '#06B6D4': '青色',
  '#52c41a': '绿色', '#52C41A': '绿色',
  '#166534': '深绿', '#166534': '深绿',
  '#84cc16': '黄绿', '#84CC16': '黄绿',
  '#fadb14': '黄色', '#FADB14': '黄色',
  '#ff7a00': '橙色', '#FF7A00': '橙色',
  '#8b4513': '棕色', '#8B4513': '棕色',
  '#7b5ea7': '紫色', '#7B5EA7': '紫色',
  '#581c87': '深紫', '#581C87': '深紫',
  '#000000': '黑色',
  '#ffffff': '白色', '#FFFFFF': '白色',
  '#8c8c8c': '灰色', '#8C8C8C': '灰色',
  '#e5e5e5': '浅灰', '#E5E5E5': '浅灰',
};

function colorName(hex) {
  return COLOR_MAP[hex] || hex;
}

export function serializeCanvas(elements) {
  if (!elements || elements.length === 0) return '画布为空';

  return '画布元素：' + elements.map(el => {
    const id = (el.id || '').slice(0, 12);
    const x = Math.round(el.x || 0);
    const y = Math.round(el.y || 0);
    const w = Math.round(el.width || 0);
    const h = Math.round(el.height || 0);

    if (el.type === 'rectangle') {
      const bg = colorName(el.backgroundColor);
      const label = el.label?.text ? `,label=${el.label.text}` : (el.name ? `,label=${el.name}` : '');
      return `[${id}:矩形@(${x},${y}),${bg},${w}x${h}${label}]`;
    }
    if (el.type === 'ellipse') {
      const bg = colorName(el.backgroundColor);
      const label = el.label?.text ? `,label=${el.label.text}` : '';
      return `[${id}:圆@(${x},${y}),${bg},${w}x${h}${label}]`;
    }
    if (el.type === 'diamond') {
      const bg = colorName(el.backgroundColor);
      const label = el.label?.text ? `,label=${el.label.text}` : '';
      return `[${id}:菱形@(${x},${y}),${bg},${w}x${h}${label}]`;
    }
    if (el.type === 'arrow') {
      const from = (el.startBinding?.elementId || '').slice(0, 12);
      const to = (el.endBinding?.elementId || '').slice(0, 12);
      const label = el.label?.text ? `,label=${el.label.text}` : (el.name ? `,label=${el.name}` : '');
      return `[${id}:箭头,from=${from},to=${to}${label}]`;
    }
    if (el.type === 'text') {
      return `[${id}:文字@(${x},${y}),"${el.text || ''}"]`;
    }
    if (el.type === 'line') {
      return `[${id}:线@(${x},${y}),${w}x${h}]`;
    }
    return `[${id}:${el.type || '未知'}@(${x},${y})]`;
  }).join(' ');
}

export function deserializeColor(name) {
  const reverse = {
    '红色': '#FF4444', '深红': '#CC0000', '粉色': '#FF69B4',
    '蓝色': '#4A90D9', '深蓝': '#1E3A8A', '青色': '#06B6D4',
    '绿色': '#52C41A', '深绿': '#166534', '黄绿': '#84CC16',
    '黄色': '#FADB14', '橙色': '#FF7A00', '棕色': '#8B4513',
    '紫色': '#7B5EA7', '深紫': '#581C87',
    '黑色': '#000000', '白色': '#FFFFFF', '灰色': '#8C8C8C', '浅灰': '#E5E5E5',
  };
  return reverse[name] || name || '#4A90D9';
}
