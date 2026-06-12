import { useState, useRef, useEffect } from 'react';
import './TabBar.css';

export default function TabBar({ tabs, activeTabId, onSwitch, onNew, onClose, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (tab) => {
    setEditingId(tab.id);
    setEditValue(tab.title);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRename?.(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar__tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-bar__tab${tab.id === activeTabId ? ' tab-bar__tab--active' : ''}`}
            onClick={() => onSwitch?.(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
          >
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                className="tab-bar__input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="tab-bar__title">{tab.title}</span>
            )}
            {tabs.length > 1 && (
              <button
                className="tab-bar__close"
                onClick={e => { e.stopPropagation(); onClose?.(tab.id); }}
                title="关闭标签"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-bar__new" onClick={onNew} title="新建绘图">
        +
      </button>
    </div>
  );
}
