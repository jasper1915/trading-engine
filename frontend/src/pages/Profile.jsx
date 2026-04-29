import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { User, Mail, Phone, ShieldCheck, CreditCard, Edit2, X, Lock, Shield, Bell, Camera } from 'lucide-react'

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editField, setEditField] = useState('')
  const [newValue, setNewValue] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [actionLoading, setActionLoading] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile')
      setProfile(res.data)
    } catch (err) {
      console.error('Failed to fetch profile', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleEditClick = (field, currentValue) => {
    setEditField(field)
    setNewValue(currentValue === 'Not provided' ? '' : currentValue)
    setOtp('')
    setOtpSent(false)
    setIsEditModalOpen(true)
  }

  const handleSendOtp = async () => {
    if (!newValue) return alert('Please enter a valid value')
    setActionLoading(true)
    try {
      await api.post('/user/send-otp', { field: editField, newValue })
      setOtpSent(true)
      alert('OTP sent successfully! Check your console/file for the OTP.')
    } catch (err) {
      alert('Failed to send OTP')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyUpdate = async () => {
    const requiresOtp = ['email', 'phone'].includes(editField)
    if (requiresOtp && !otp) return alert('Please enter OTP')
    if (!requiresOtp && !newValue) return alert('Please provide a value')
    
    setActionLoading(true)
    try {
      const payload = { field: editField, newValue }
      if (requiresOtp) payload.otp = otp
      
      const res = await api.post('/user/update-profile', payload)
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
      }
      alert('Profile updated successfully!')
      setIsEditModalOpen(false)
      fetchProfile()
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP or update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return alert('Please fill all fields')
    setActionLoading(true)
    try {
      await api.post('/user/change-password', { currentPassword, newPassword })
      alert('Password changed successfully!')
      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle2fa = async (enable) => {
    try {
      await api.post('/user/toggle-2fa', { enable })
      fetchProfile()
    } catch (err) {
      alert('Failed to update 2FA settings')
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</div>
  }

  if (!profile) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Failed to load profile.</div>
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your identity and security preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Profile Card */}
        <div className="glass" style={{ borderRadius: '24px', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => handleEditClick('profilePic', profile.profilePic || '')}
            >
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '30px', 
                background: 'linear-gradient(135deg, var(--brand-primary), #60a5fa)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#000', fontSize: '2.5rem', fontWeight: 'bold',
                overflow: 'hidden',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
              }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ 
                position: 'absolute', bottom: '-5px', right: '-5px', 
                background: 'var(--brand-primary)', color: '#000', 
                padding: '6px', borderRadius: '12px', border: '3px solid #0f172a'
              }}>
                <Camera size={14} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{profile.username}</h2>
                <button 
                  onClick={() => handleEditClick('username', profile.username)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  <Edit2 size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-success)', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                  <ShieldCheck size={16} /> Verified
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ID: {profile.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div className="glass-inner" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Email Address</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{profile.email}</span>
                  <button onClick={() => handleEditClick('email', profile.email)} style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}><Edit2 size={16}/></button>
                </div>
             </div>
             <div className="glass-inner" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Phone Number</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{profile.phone}</span>
                  <button onClick={() => handleEditClick('phone', profile.phone)} style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}><Edit2 size={16}/></button>
                </div>
             </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="var(--brand-primary)" /> Security Suite
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>
                  <Lock size={20} />
                </div>
                <span style={{ fontWeight: 600 }}>Login Password</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Used to sign in to your account.</p>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Change Password
              </button>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--brand-success)' }}>
                    <Shield size={20} />
                  </div>
                  <span style={{ fontWeight: 600 }}>2FA Protection</span>
                </div>
                <div 
                  onClick={() => handleToggle2fa(!profile.is2faEnabled)}
                  style={{ 
                    width: '44px', height: '24px', borderRadius: '12px', 
                    background: profile.is2faEnabled ? 'var(--brand-success)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: '0.3s'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px', left: profile.is2faEnabled ? '23px' : '3px',
                    transition: '0.3s'
                  }} />
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Secure your trades with Google Authenticator or SMS.</p>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ background: '#1e293b', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px' }}>Update {editField}</h3>
            
            <div style={{ marginBottom: '20px' }}>
              {editField === 'profilePic' ? (
                <div style={{ textAlign: 'center' }}>
                  <input type="file" accept="image/*" id="fileInput" hidden onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => setNewValue(reader.result)
                      reader.readAsDataURL(file)
                    }
                  }} />
                  <label htmlFor="fileInput" style={{ display: 'block', padding: '40px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', cursor: 'pointer' }}>
                    {newValue ? <img src={newValue} style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' }} /> : <Camera size={32} color="var(--text-secondary)" />}
                    <p style={{ fontSize: '0.8rem', marginTop: '12px', color: 'var(--text-secondary)' }}>Click to upload image</p>
                  </label>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                />
              )}
            </div>

            {['email', 'phone'].includes(editField) && otpSent && (
              <div style={{ marginBottom: '24px' }}>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--brand-primary)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
              </div>
            )}

            <button 
              onClick={(!['email', 'phone'].includes(editField) || otpSent) ? handleVerifyUpdate : handleSendOtp}
              disabled={actionLoading}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--brand-primary)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {actionLoading ? 'Processing...' : (otpSent ? 'Confirm' : 'Save Changes')}
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ background: '#1e293b', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsPasswordModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px' }}>Change Password</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
            </div>

            <button 
              onClick={handleChangePassword}
              disabled={actionLoading}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--brand-primary)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {actionLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Profile
