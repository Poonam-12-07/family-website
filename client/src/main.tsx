import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from '@/lib/config';
import { Layout } from '@/components/layout/Layout';
import ExpensesPage from '@/pages/ExpensesPage';
import RemindersPage from '@/pages/RemindersPage';
import HealthPage from '@/pages/HealthPage';
import FamilyBoardPage from '@/pages/FamilyBoardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ExpensesPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/family" element={<FamilyBoardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
