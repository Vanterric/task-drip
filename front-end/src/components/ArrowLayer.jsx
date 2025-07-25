// ArrowLayer.jsx
import { createPortal } from 'react-dom';

export default function ArrowLayer({ children }) {
  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-visible"
      style={{ width: '100vw', height: '100vh' }}
    >
      {children}
    </div>,
    document.body
  );
}
