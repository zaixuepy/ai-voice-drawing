import { useState, useCallback, useRef } from 'react';
import { convertToExcalidrawElements, CaptureUpdateAction } from '@excalidraw/excalidraw';

let _idCounter = 0;
function generateId(prefix) {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function useCanvasState() {
  const [elements, setElements] = useState([]);
  const excalidrawAPIRef = useRef(null);

  const getAPI = useCallback(() => excalidrawAPIRef.current, []);

  const getElements = useCallback(() => {
    try {
      return excalidrawAPIRef.current?.getSceneElements?.() || [];
    } catch {
      return [];
    }
  }, []);

  const refreshElements = useCallback(() => {
    setElements(getElements());
  }, [getElements]);

  const setExcalidrawAPI = useCallback((api) => {
    excalidrawAPIRef.current = api;
  }, []);

  const addElement = useCallback((elementData) => {
    const api = excalidrawAPIRef.current;
    if (!api) return null;

    const id = elementData.id || generateId(
      elementData.shape === 'ellipse' ? 'circle' :
      elementData.shape === 'diamond' ? 'diamond' :
      elementData.shape === 'text' ? 'text' : 'rect'
    );

    const skeleton = {
      id,
      type: elementData.shape === 'ellipse' ? 'ellipse' :
            elementData.shape === 'diamond' ? 'diamond' :
            elementData.shape === 'text' ? 'text' : 'rectangle',
      x: elementData.x ?? 200,
      y: elementData.y ?? 200,
      ...(elementData.shape !== 'text' && {
        width: elementData.width ?? (elementData.shape === 'ellipse' ? 80 : 120),
        height: elementData.height ?? (elementData.shape === 'ellipse' ? 80 : 60),
      }),
      ...(elementData.backgroundColor && elementData.shape !== 'text'
        ? { backgroundColor: elementData.backgroundColor } : {}),
      ...(elementData.strokeColor ? { strokeColor: elementData.strokeColor } : {}),
      ...(elementData.strokeWidth ? { strokeWidth: elementData.strokeWidth } : {}),
      ...(elementData.strokeStyle ? { strokeStyle: elementData.strokeStyle } : {}),
      ...(elementData.fillStyle ? { fillStyle: elementData.fillStyle } : {}),
      ...(elementData.roughness !== undefined ? { roughness: elementData.roughness } : {}),
      ...(elementData.opacity !== undefined ? { opacity: elementData.opacity } : {}),
      ...(elementData.roundness !== undefined ? { roundness: elementData.roundness } : {}),
      ...(elementData.shape === 'text' ? {
        text: elementData.text || '',
        fontSize: elementData.fontSize || 20,
        strokeColor: elementData.strokeColor || '#000000',
      } : {}),
      ...(elementData.label ? {
        label: {
          text: elementData.label,
          ...(elementData.labelColor ? { strokeColor: elementData.labelColor } : {}),
          ...(elementData.fontSize ? { fontSize: elementData.fontSize } : {}),
        },
      } : {}),
    };

    const sceneData = api.getSceneElements();
    const newElements = convertToExcalidrawElements([skeleton], { regenerateIds: false });

    api.updateScene({
      elements: [...sceneData, ...newElements],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    setTimeout(() => refreshElements(), 60);
    return id;
  }, [refreshElements]);

  const updateElement = useCallback((targetId, changes) => {
    const api = excalidrawAPIRef.current;
    if (!api) return false;

    const sceneData = api.getSceneElements();
    const index = sceneData.findIndex(el =>
      el.id === targetId || el.id?.startsWith(targetId) || el.id?.endsWith(targetId)
    );
    if (index === -1) return false;

    const updated = [...sceneData];
    const el = { ...updated[index] };

    if (changes.x !== undefined) el.x = changes.x;
    if (changes.y !== undefined) el.y = changes.y;
    if (changes.width !== undefined) el.width = changes.width;
    if (changes.height !== undefined) el.height = changes.height;
    if (changes.backgroundColor !== undefined) el.backgroundColor = changes.backgroundColor;
    if (changes.strokeColor !== undefined) el.strokeColor = changes.strokeColor;
    if (changes.strokeWidth !== undefined) el.strokeWidth = changes.strokeWidth;
    if (changes.strokeStyle !== undefined) el.strokeStyle = changes.strokeStyle;
    if (changes.fillStyle !== undefined) el.fillStyle = changes.fillStyle;
    if (changes.roughness !== undefined) el.roughness = changes.roughness;
    if (changes.opacity !== undefined) el.opacity = changes.opacity;
    if (changes.roundness !== undefined) el.roundness = changes.roundness;
    if (changes.label !== undefined) {
      el.label = { text: changes.label };
    }

    updated[index] = el;

    api.updateScene({
      elements: updated,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    setTimeout(() => refreshElements(), 60);
    return true;
  }, [refreshElements]);

  const deleteElement = useCallback((targetId) => {
    const api = excalidrawAPIRef.current;
    if (!api) return false;

    const sceneData = api.getSceneElements();
    const filtered = sceneData.filter(el =>
      el.id !== targetId && !el.id?.startsWith(targetId) && !el.id?.endsWith(targetId)
    );
    if (filtered.length === sceneData.length) return false;

    api.updateScene({
      elements: filtered,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    setTimeout(() => refreshElements(), 60);
    return true;
  }, [refreshElements]);

  const restoreElements = useCallback((elements) => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    api.updateScene({
      elements: elements || [],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    setTimeout(() => refreshElements(), 60);
  }, [refreshElements]);

  const clearCanvas = useCallback(() => {
    try {
      excalidrawAPIRef.current?.resetScene?.();
    } catch {
      excalidrawAPIRef.current?.updateScene?.({ elements: [] });
    }
    setTimeout(() => setElements([]), 60);
  }, []);

  const undo = useCallback(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    setTimeout(() => refreshElements(), 80);
  }, [refreshElements]);

  const addArrow = useCallback((fromId, toId, label) => {
    const api = excalidrawAPIRef.current;
    if (!api) return false;

    const sceneData = api.getSceneElements();

    const fromEl = sceneData.find(el =>
      el.id === fromId || el.id?.startsWith(fromId) || el.id?.endsWith(fromId)
    );
    const toEl = sceneData.find(el =>
      el.id === toId || el.id?.startsWith(toId) || el.id?.endsWith(toId)
    );

    if (!fromEl || !toEl) return false;

    const arrowSkeleton = {
      id: generateId('arrow'),
      type: 'arrow',
      x: fromEl.x + (fromEl.width || 0) / 2,
      y: fromEl.y + (fromEl.height || 0) / 2,
      start: { id: fromEl.id },
      end: { id: toEl.id },
      ...(label ? { label: { text: label } } : {}),
      endArrowhead: 'arrow',
    };

    const arrowElements = convertToExcalidrawElements([arrowSkeleton], { regenerateIds: false });

    api.updateScene({
      elements: [...sceneData, ...arrowElements],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    setTimeout(() => refreshElements(), 60);
    return true;
  }, [refreshElements]);

  const executeActions = useCallback(async (actions) => {
    const results = [];
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'add_shape': {
            const id = addElement(action);
            results.push({ type: 'add_shape', id, success: !!id });
            break;
          }
          case 'modify_shape': {
            const success = updateElement(action.targetId, action.changes);
            results.push({ type: 'modify_shape', targetId: action.targetId, success });
            break;
          }
          case 'delete_shape': {
            const success = deleteElement(action.targetId);
            results.push({ type: 'delete_shape', targetId: action.targetId, success });
            break;
          }
          case 'add_arrow': {
            const success = addArrow(action.fromId, action.toId, action.label);
            results.push({ type: 'add_arrow', fromId: action.fromId, toId: action.toId, success });
            break;
          }
          case 'clear_canvas':
            clearCanvas();
            results.push({ type: 'clear_canvas', success: true });
            break;
          default:
            results.push({ type: action.type, success: false, error: 'Unknown action type' });
        }
      } catch (err) {
        console.error('Action execution error:', err);
        results.push({ type: action.type, success: false, error: err.message });
      }
      await new Promise(r => setTimeout(r, 50));
    }
    return results;
  }, [addElement, updateElement, deleteElement, addArrow, clearCanvas]);

  return {
    elements,
    setExcalidrawAPI,
    refreshElements,
    getElements,
    addElement,
    updateElement,
    deleteElement,
    clearCanvas,
    undo,
    addArrow,
    executeActions,
    restoreElements,
  };
}
