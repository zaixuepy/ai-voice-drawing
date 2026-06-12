import { useCallback, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './Canvas.css';

export default function Canvas({ onExcalidrawAPIReady, onElementsChange }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  const excalidrawRef = useCallback((api) => {
    if (api) {
      setExcalidrawAPI(api);
      onExcalidrawAPIReady?.(api);
    }
  }, [onExcalidrawAPIReady]);

  return (
    <div className="canvas-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Excalidraw
        excalidrawAPI={excalidrawRef}
        onChange={(elements, appState, files) => {
          onElementsChange?.(elements);
        }}
        initialData={{
          elements: [],
          appState: {
            viewBackgroundColor: '#FAFBFC',
            currentItemFontFamily: 1,
            showWelcomeScreen: false,
          },
        }}
        theme="light"
        UIOptions={{
          welcomeScreen: false,
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: { saveFileToDisk: false },
            toggleTheme: false,
            changeViewBackgroundColor: false,
            clearCanvas: false,
            saveAsImage: false,
          },
          tools: {
            image: false,
          },
        }}
      />
    </div>
  );
}
