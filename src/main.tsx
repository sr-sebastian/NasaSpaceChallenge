import { StrictMode, Suspense, lazy, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigator } from './navigator/Navigator';

// El simulador 3D original queda como «modo docente» y se carga solo bajo demanda (con sus estilos).
const Teach = lazy(() => Promise.all([import('./App'), import('./index.css'), import('./redesign.css')]).then(([m]) => ({ default: m.default })));

function Root() {
  const [teach, setTeach] = useState(() => location.hash.includes('teach'));
  if (teach) return <Suspense fallback={null}><Teach /><button className="nv-teach-back" onClick={() => location.reload()}>← Navigator</button></Suspense>;
  return <Navigator onTeach={() => setTeach(true)} />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
