import { Navigate, Route, Routes } from 'react-router-dom';

import { CreatePage } from './pages/CreatePage';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/play/:slug" element={<PlayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
