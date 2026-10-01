import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against cross-origin iframe parent/location property access errors
// and window.fetch getter-only property assignments in preview environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error?.message || '');
    if (
      msg.includes("Blocked a frame with origin") ||
      msg.includes("cross-origin frame") ||
      msg.includes("Cannot set property fetch") ||
      msg.includes("fetch of #<Window>") ||
      msg.includes("'origin' from 'Location'")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || '');
    if (
      msg.includes("Blocked a frame with origin") ||
      msg.includes("cross-origin frame") ||
      msg.includes("Cannot set property fetch") ||
      msg.includes("fetch of #<Window>") ||
      msg.includes("'origin' from 'Location'")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
