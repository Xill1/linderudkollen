import { useEffect, useState } from 'react';

function ProgressBar() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 580);
    return () => clearTimeout(t);
  }, []);
  return done ? null : <div className="nav-progress-bar" />;
}

export default function PageTransition({ children, scrollTop = true }) {
  useEffect(() => {
    if (scrollTop) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [scrollTop]);

  return (
    <>
      <ProgressBar />
      <div className="page-enter">{children}</div>
    </>
  );
}
