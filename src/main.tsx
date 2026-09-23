import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import './index.css'

import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthLogin } from './screens/AuthLogin'
import { ProjectList } from './screens/ProjectList'
import App from './App'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLogin />,
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <ProjectList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:projectId',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/projects" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/projects" replace />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
