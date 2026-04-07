import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FamilySetupPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FamilySetupPage = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, updateFamily } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/family/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: familyName, userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create family');

      updateFamily(data.family._id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/family/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase(), userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join family');

      updateFamily(data.family._id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="family-setup-container">
      <div className="card setup-card">
        <h1 className="setup-title">Family Setup</h1>
        <p className="setup-subtitle">Create a new family group or join an existing one.</p>
        
        <div className="setup-tabs">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Family
          </button>
          <button 
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Family
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="tab-content">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Family Name</label>
                <input 
                  type="text" 
                  value={familyName} 
                  onChange={(e) => setFamilyName(e.target.value)} 
                  required 
                  placeholder="e.g. Smith Expedition"
                />
              </div>
              <button type="submit" className="btn-primary mt-4" disabled={loading}>
                {loading ? 'Creating...' : 'Create Family & Get Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>6-Character Invite Code</label>
                <input 
                  type="text" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value)} 
                  required 
                  maxLength={6}
                  placeholder="ABC123"
                  className="code-input"
                />
              </div>
              <button type="submit" className="btn-primary mt-4" disabled={loading}>
                {loading ? 'Joining...' : 'Join Family Group'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilySetupPage;
