import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'

document.getElementById("preload-screen")?.remove();


const App = lazy(() => import('./App.jsx'));
const { AuthProvider } = await import('./context/AuthContext.jsx');
const { ThemeProvider } = await import('./context/ThemeContext.jsx');
const { ColorProvider } = await import('./context/ColorContext.jsx');








createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div />}>
    <AuthProvider>
      <ThemeProvider>
        <ColorProvider>
      
    <App />
    
    </ColorProvider>
    </ThemeProvider>
    </AuthProvider>
    </Suspense>
  </StrictMode>,
)
