import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { TrendingUp, User as UserIcon, Lock, UserPlus, Loader2, Key, CreditCard, Mail, Phone } from 'lucide-react'

const Register = () => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  const [verifyMethod, setVerifyMethod] = useState('email') // 'email', 'phone'
  const [otpSent, setOtpSent] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const identifier = verifyMethod === 'email' ? email : phone
    if (!identifier) return setError(`Please enter a ${verifyMethod}`)
    if (verifyMethod === 'email' && !email.includes('@')) return setError('Invalid email')
    if (verifyMethod === 'phone' && phone.length < 10) return setError('Invalid phone number')

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/send-otp', { identifier })
      setOtpSent(true)
      setSuccess(`OTP sent to your ${verifyMethod}!`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username || !panNumber || !password) return setError('Please fill all details')
    setLoading(true)
    setError('')
    try {
      const identifier = verifyMethod === 'email' ? email : phone
      await api.post('/auth/register-verified', { 
        identifier, 
        otp, 
        email,
        phone,
        password,
        username,
        panNumber
      })
      setSuccess('Account Created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, #1e2329, #0b0e11)', padding: '40px 0' }}>
      <div className="glass" style={{ width: '420px', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--brand-primary)', display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(240, 185, 11, 0.1)', marginBottom: '16px' }}>
            <UserPlus size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Join Stockify for secure trading</p>
        </div>

        <form onSubmit={otpSent ? handleRegister : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: verifyMethod === 'email' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={otpSent}
                onFocus={() => !otpSent && setVerifyMethod('email')}
                style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: `1px solid ${verifyMethod === 'email' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
              />
              {verifyMethod === 'email' && !otpSent && <span style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 700 }}>VERIFYING</span>}
            </div>

            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: verifyMethod === 'phone' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Phone Number (e.g. 91...)" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                disabled={otpSent}
                onFocus={() => !otpSent && setVerifyMethod('phone')}
                style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: `1px solid ${verifyMethod === 'phone' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
              />
              {verifyMethod === 'phone' && !otpSent && <span style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 700 }}>VERIFYING</span>}
            </div>
          </div>
          
          {otpSent && (
            <>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--brand-primary)' }} />
                <input type="text" placeholder={`Enter OTP sent to ${verifyMethod}`} value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid var(--brand-primary)', background: 'rgba(240, 185, 11, 0.05)', color: '#fff', outline: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Full Name" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="PAN Number (10 digits)" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} maxLength={10} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
              </div>
              
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingLeft: '40px', height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--brand-danger)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(244, 67, 54, 0.1)', padding: '8px', borderRadius: '4px' }}>{error}</div>}
          {success && <div style={{ color: 'var(--brand-success)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(0, 192, 118, 0.1)', padding: '8px', borderRadius: '4px' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ height: '48px', background: 'var(--brand-primary)', color: '#000', border: 'none', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : (otpSent ? 'Verify & Create Account' : `Send OTP to ${verifyMethod === 'email' ? 'Email' : 'Mobile'}`)}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>Log In</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
