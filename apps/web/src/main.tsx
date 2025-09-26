import { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const INTRO_BODY_CLASS = 'intro-active';
const STAMP_LIFETIME = 1900;

const StampSplash = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const { classList } = document.body;

    if (visible) {
      classList.add(INTRO_BODY_CLASS);
    } else {
      classList.remove(INTRO_BODY_CLASS);
    }

    return () => {
      classList.remove(INTRO_BODY_CLASS);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const hideTimer = window.setTimeout(() => setVisible(false), STAMP_LIFETIME);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="stamp-overlay" aria-hidden="true">
      <div className="stamp">
        <span className="stamp__text">FOONGDOLL</span>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <>
    <StampSplash />
    <App />
  </>,
);
