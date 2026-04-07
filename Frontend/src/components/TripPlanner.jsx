import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './TripPlanner.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TripCard = ({ trip, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('roadmap');
  
  // Roadmap states
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [locationName, setLocationName] = useState('');
  
  // Vehicle states
  const [makeModel, setMakeModel] = useState(trip.vehicleDetails?.makeModel || '');
  const [licensePlate, setLicensePlate] = useState(trip.vehicleDetails?.licensePlate || '');

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiError, setAiError] = useState('');

  const handleAddStop = async (e) => {
    e.preventDefault();
    const newSchedule = [...trip.schedule, { time, activity, locationName }];
    try {
      const res = await fetch(`${API_URL}/api/trip/${trip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule })
      });
      const updated = await res.json();
      onUpdate(updated);
      setTime(''); setActivity(''); setLocationName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVehicle = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/trip/${trip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleDetails: { makeModel, licensePlate } })
      });
      const updated = await res.json();
      onUpdate(updated);
      alert('Vehicle details saved!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearVehicle = async () => {
    setMakeModel('');
    setLicensePlate('');
    try {
      const res = await fetch(`${API_URL}/api/trip/${trip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleDetails: { makeModel: '', licensePlate: '' } })
      });
      const updated = await res.json();
      onUpdate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetRecommendations = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const locations = trip.schedule.map(s => s.locationName);
      const res = await fetch(`${API_URL}/api/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch AI data');
      setAiRecommendations(data);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiRecommendation = async (rec) => {
    const newSchedule = [...trip.schedule, { time: '12:00', locationName: rec.name, activity: rec.description }];
    try {
      const res = await fetch(`${API_URL}/api/trip/${trip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule })
      });
      const updated = await res.json();
      onUpdate(updated);
      setAiRecommendations(prev => prev.filter(r => r.name !== rec.name));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card trip-card">
      <div className="trip-header">
        <div>
          <h3>{trip.title}</h3>
          <p>{new Date(trip.date).toLocaleDateString()}</p>
        </div>
        <button onClick={() => onDelete(trip._id)} className="btn-delete">Delete</button>
      </div>

      <div className="trip-tabs">
        <button 
          className={activeTab === 'roadmap' ? 'active' : ''} 
          onClick={() => setActiveTab('roadmap')}
        >
          Road Map
        </button>
        <button 
          className={activeTab === 'vehicle' ? 'active' : ''} 
          onClick={() => setActiveTab('vehicle')}
        >
          Vehicle Details
        </button>
      </div>

      <div className="trip-content">
        {activeTab === 'roadmap' && (
          <div className="roadmap-tab">
            <div className="timeline">
              {trip.schedule && trip.schedule.length > 0 ? (
                trip.schedule.map((stop, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="time">{stop.time}</span>
                      <strong>{stop.locationName}</strong>
                      <p>{stop.activity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No stops scheduled yet.</p>
              )}
            </div>

            <form onSubmit={handleAddStop} className="add-stop-form">
              <h4>Add Stop</h4>
              <div className="form-row">
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} />
                <input type="text" required placeholder="Location" value={locationName} onChange={e => setLocationName(e.target.value)} />
              </div>
              <input type="text" required placeholder="Activity (e.g. Lunch, Sightseeing)" value={activity} onChange={e => setActivity(e.target.value)} />
              <button type="submit" className="btn-primary-small">+ Add</button>
            </form>

            <div className="ai-recommendations-section mt-4">
              <button type="button" onClick={handleGetRecommendations} className="btn-ai-sparkle" disabled={aiLoading}>
                {aiLoading ? '✨ Generating Smart Suggestions...' : '✨ Get AI Spot Recommendations'}
              </button>
              {aiError && <p className="text-error">{aiError}</p>}
              
              {aiRecommendations.length > 0 && (
                <div className="ai-cards-container">
                  <h4 className="mt-4">Recommended Nearby Stops</h4>
                  {aiRecommendations.map((rec, idx) => (
                    <div key={idx} className="ai-card">
                      <div className="ai-icon">{rec.icon || '📍'}</div>
                      <div className="ai-content">
                        <strong>{rec.name}</strong>
                        <p>{rec.description}</p>
                      </div>
                      <button onClick={() => handleAddAiRecommendation(rec)} className="btn-text-small add-ai-btn">
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="vehicle-tab">
            <form onSubmit={handleSaveVehicle}>
              <div className="form-group-small">
                <label>Make / Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Toyota Innova" 
                  value={makeModel} 
                  onChange={e => setMakeModel(e.target.value)} 
                />
              </div>
              <div className="form-group-small">
                <label>License Plate</label>
                <input 
                  type="text" 
                  placeholder="e.g. TN-01-AB-1234" 
                  value={licensePlate} 
                  onChange={e => setLicensePlate(e.target.value)} 
                />
              </div>
              <div className="vehicle-actions">
                <button type="submit" className="btn-primary-small">Save</button>
                <button type="button" onClick={handleClearVehicle} className="btn-text-small">Clear</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const TripPlanner = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [user.familyGroupId]);

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API_URL}/api/trip/family/${user.familyGroupId}`);
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, familyGroupId: user.familyGroupId })
      });
      const newTrip = await res.json();
      setTrips([...trips, newTrip]);
      setShowCreate(false);
      setTitle(''); setDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = (updatedTrip) => {
    setTrips(trips.map(t => t._id === updatedTrip._id ? updatedTrip : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trip?")) return;
    try {
      await fetch(`${API_URL}/api/trip/${id}`, { method: 'DELETE' });
      setTrips(trips.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="trip-planner-panel">
      <div className="planner-header">
        <div className="planner-title-group">
          <h2>Trip Planner</h2>
          <p className="planner-subtitle">Powered by <span>✨ Gemini AI</span>. Open a trip to generate custom smart stops!</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-create">
          {showCreate ? 'Cancel' : '+ New Trip'}
        </button>
      </div>

      <div className="planner-scroll-content">
        {showCreate && (
          <form onSubmit={handleCreateTrip} className="create-trip-form">
            <input 
              type="text" 
              placeholder="Trip Title (e.g. Kodaikanal 2026)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary-small">Create</button>
          </form>
        )}

        <div className="trips-list">
          {trips.length === 0 ? (
            <p className="empty-text mt-4">No trips added. Create one above!</p>
          ) : (
            trips.map(trip => (
              <TripCard 
                key={trip._id} 
                trip={trip} 
                onUpdate={handleUpdate} 
                onDelete={handleDelete} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
