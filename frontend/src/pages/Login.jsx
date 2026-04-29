import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { TrendingUp, User as UserIcon, Lock, Loader2, Key } from 'lucide-react'

const Login = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [mode, setMode] = useState('password') // 'password', 'otp', 'forgot'
  const [method, setMethod] = useState('email') // 'email', 'phone'
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!identifier) return setError('Please enter your email or phone number')
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/send-otp', { identifier })
      setOtpSent(true)
      setSuccess(`OTP sent successfully to ${identifier}!`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      let res
      if (mode === 'password') {
        const payload = identifier.includes('@') ? { email: identifier, password } : { phone: identifier, password }
        res = await api.post('/auth/login', payload)
      } else if (mode === 'otp') {
        res = await api.post('/auth/login-otp', { identifier, otp })
      }
      onLogin(res.data.token)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { identifier, otp, newPassword })
      setSuccess('Password reset successfully! You can now log in.')
      setMode('password')
      setOtpSent(false)
      setOtp('')
      setPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, #1e2329, #0b0e11)' }}>
      <div className="glass" style={{ width: '420px', padding: '48px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--brand-primary)', display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(240, 185, 11, 0.1)', marginBottom: '16px' }}>
            <TrendingUp size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
            {mode === 'forgot' ? 'Reset Password' : 'Welcome back'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {mode === 'forgot' ? 'Enter your details to retrieve your account' : 'Log in to your Stockify account'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <button onClick={() => {setMode('password'); setOtpSent(false); setError(''); setSuccess('')}} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: mode === 'password' ? 'var(--brand-primary)' : 'transparent', color: mode === 'password' ? '#000' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Password</button>
          <button onClick={() => {setMode('otp'); setOtpSent(false); setError(''); setSuccess('')}} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: mode === 'otp' ? 'var(--brand-primary)' : 'transparent', color: mode === 'otp' ? '#000' : '#fff', fontWeight: 600, cursor: 'pointer' }}>OTP Login</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '-8px' }}>
          <button onClick={() => {setMethod('email'); setIdentifier(''); setOtpSent(false)}} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: method === 'email' ? '2px solid var(--brand-primary)' : 'none', color: method === 'email' ? 'var(--brand-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Email</button>
          <button onClick={() => {setMethod('phone'); setIdentifier(''); setOtpSent(false)}} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: method === 'phone' ? '2px solid var(--brand-primary)' : 'none', color: method === 'phone' ? 'var(--brand-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Phone</button>
        </div>

        <form onSubmit={mode === 'forgot' ? (otpSent ? handleResetPassword : handleSendOtp) : (mode === 'otp' && !otpSent ? handleSendOtp : handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ position: 'relative' }}>
            <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type={method === 'email' ? 'email' : 'text'} 
              placeholder={method === 'email' ? 'Email Address' : 'Phone Number (e.g. 91...)'} 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              required 
              disabled={otpSent && mode !== 'password'} 
              style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
            />
          </div>
          
          {mode === 'password' && (
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
            </div>
          )}

          {(mode === 'otp' || mode === 'forgot') && otpSent && (
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
            </div>
          )}

          {mode === 'forgot' && otpSent && (
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
            </div>
          )}

          {error && <div style={{ color: 'var(--brand-danger)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: 'var(--brand-success)', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ height: '48px', background: 'var(--brand-primary)', color: '#000', border: 'none', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              mode === 'password' ? 'Log In' :
              (mode === 'otp' ? (otpSent ? 'Verify & Log In' : 'Send OTP') : 
              (otpSent ? 'Set New Password' : 'Send OTP'))
            )}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
          {mode !== 'forgot' && (
            <button onClick={() => {setMode('forgot'); setOtpSent(false); setError(''); setSuccess('')}} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Forgot Password?</button>
          )}
          <p style={{ color: 'var(--text-secondary)' }}>Don't have an account? <Link to="/register" style={{ color: 'var(--brand-primary)' }}>Create one</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login
