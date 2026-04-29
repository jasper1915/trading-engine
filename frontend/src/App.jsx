import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Portfolio from './pages/Portfolio'
import Profile from './pages/Profile'
import AiAssistant from './components/AiAssistant'
import { NotificationProvider } from './context/NotificationContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    const t = localStorage.getItem('token')
    return t && t !== 'undefined'
  })

  const handleLogin = (token) => {
    if (token && token !== 'undefined') {
      localStorage.setItem('token', token)
      setIsAuthenticated(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return (
    <NotificationProvider>
      <Router>
        <div className="app-container">
          {isAuthenticated && <Navbar onLogout={handleLogout} />}
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
            />
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/portfolio" 
              element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
          </Routes>
          {isAuthenticated && <AiAssistant />}
        </div>
      </Router>
    </NotificationProvider>
  )
}

export default App
