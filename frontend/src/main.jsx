import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/design-tokens.css';
import './styles/global.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(App)
  )
);
