import { Navigate, Route, Routes } from 'react-router-dom'
import { FileBrowserPage } from '../../pages/FileBrowserPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/folders/:folderId?" element={<FileBrowserPage />} />
      <Route path="*" element={<Navigate to="/folders" replace />} />
    </Routes>
  )
}
