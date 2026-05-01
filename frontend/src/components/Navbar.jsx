import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Wallet, LogOut, TrendingUp, User, Sun, Moon } from 'lucide-react'

const Navbar = ({ onLogout }) => {
  const location = useLocation()
  
  const navItems = [
    { name: 'Trade', path: '/', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: Wallet },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  const [profile, setProfile] = useState(null)

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile')
        setProfile(res.data)
      } catch (err) {
        console.error('Failed to fetch profile for navbar', err)
      }
    }
    fetchProfile()
  }, [])

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <nav className="glass desktop-only" style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)' }}>
            <TrendingUp size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>STOCKIFY</span>
          </div>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {profile && (
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-primary)' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.1)'
              }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.username !== 'Not provided' ? profile.username.charAt(0).toUpperCase() : (profile.email !== 'Not provided' ? profile.email.charAt(0).toUpperCase() : 'U')
                )}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {profile.username !== 'Not provided' ? profile.username.split(' ')[0] : 'Profile'}
              </span>
            </Link>
          )}

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVBAR */}
      <nav className="glass mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 12px',
        zIndex: 1000,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '20px 20px 0 0'
      }}>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: location.pathname === item.path ? 'var(--brand-primary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px'
            }}
          >
            <item.icon size={22} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{item.name}</span>
          </Link>
        ))}
        
        {/* Mobile Profile Toggle/Theme could go here if needed, but keeping it clean for now */}
        <Link 
          to="/profile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: location.pathname === '/profile' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '8px'
          }}
        >
          <User size={22} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Me</span>
        </Link>
      </nav>

      {/* MOBILE TOP BAR (Logo + Theme) */}
      <div className="mobile-only glass" style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)' }}>
          <TrendingUp size={22} />
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>STOCKIFY</span>
        </div>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </>
  )
}

export default Navbar
