import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import './index.css';
import App from './App.tsx';
import { request } from './api';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SWRConfig value={{ fetcher: request, revalidateOnFocus: false, shouldRetryOnError: false }}>
        <App />
      </SWRConfig>
    </BrowserRouter>
  </StrictMode>
);
