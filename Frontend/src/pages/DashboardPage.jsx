import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import TripPlanner from '../components/TripPlanner';
import 'leaflet/dist/leaflet.css';
import './DashboardPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to create dynamic teardrop pins using pure CSS
const createTeardropIcon = (name, color) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `<div class="teardrop-pin" style="background-color: ${color}"><span>${initial}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const COLORS = ['#0ea5e9', '#10b981', '#06b6d4', '#4ade80', '#3b82f6', '#22c55e'];

// Haversine formula to calculate distance in KM
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '?';
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

// Component to dynamically update map center to user location on initial load or when locked
const MapUpdater = ({ center, isLocked }) => {
  const map = useMap();
  useEffect(() => {
    if (center && (isLocked || !map.getCenter().equals(center))) {
      map.setView(center, isLocked ? 16 : map.getZoom());
    }
  }, [center, isLocked]);
  return null;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [locations, setLocations] = useState({});
  const [myLocation, setMyLocation] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  
  const socketRef = useRef(null);
  
  // Mobile UI States
  const [activePanel, setActivePanel] = useState('none'); // 'none', 'directory', 'planner'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial family members and locations
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await fetch(`${API_URL}/api/family/${user.familyGroupId}`);
        const data = await res.json();
        if (res.ok && data.members) {
          setFamilyMembers(data.members);
          setInviteCode(data.inviteCode);
          const initialLocs = {};
          data.members.forEach((m) => {
            if (m.currentLocation && m.currentLocation.coordinates[0] !== 0) {
              // coordinates are [lng, lat], Leaflet uses [lat, lng]
              initialLocs[m._id] = [m.currentLocation.coordinates[1], m.currentLocation.coordinates[0]];
            }
          });
          setLocations(initialLocs);
        }
      } catch (err) {
        console.error('Failed to fetch family:', err);
      }
    };
    fetchFamily();
  }, [user.familyGroupId]);

  // Setup Socket.io and Geolocation
  useEffect(() => {
    socketRef.current = io(API_URL);
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinFamilyRoom', user.familyGroupId);
    });

    socketRef.current.on('locationUpdated', (data) => {
      if (data.userId !== user.id) {
        setLocations(prev => ({
          ...prev,
          [data.userId]: [data.coordinates[1], data.coordinates[0]] // convert lnglat to latlng
        }));
      }
    });

    socketRef.current.on('emergencySOS', (data) => {
      triggerSosAlert(data);
    });

    // Start tracking
    let watchId;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyLocation([lat, lng]);

          // Broadcast via Socket.io instantly if sharing is enabled
          if (isSharingLocation) {
            socketRef.current.emit('updateLocation', {
              familyGroupId: user.familyGroupId,
              userId: user.id,
              coordinates: [lng, lat]
            });

            // Also save to DB periodically
            fetch(`${API_URL}/api/user/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, coordinates: [lng, lat] })
            }).catch(console.error);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socketRef.current.disconnect();
    };
  }, [user.id, user.familyGroupId, isSharingLocation]);

  const triggerSosAlert = (data) => {
    setSosActive(true);
    const member = familyMembers.find(m => m._id === data.triggeredBy);
    const triggerName = member ? member.name : 'A family member';
    setSosMessage(`🚨 ${triggerName} HAS TRIGGERED AN EMERGENCY SOS! 🚨`);
    
    // Play an audible beep using Web Audio API so no external asset is needed
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // volume
      oscillator.start();
      
      // Beep pattern
      setTimeout(() => oscillator.stop(), 500);
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        osc2.connect(gainNode);
        osc2.type = 'square';
        osc2.start();
        setTimeout(() => osc2.stop(), 500);
      }, 800);
    } catch (e) {
      console.error('Audio failed', e);
    }
  };

  const handleSosClick = () => {
    // Instantly emit entirely bypassing DB
    socketRef.current.emit('triggerSOS', {
      familyGroupId: user.familyGroupId,
      userId: user.id
    });
    // Trigger locally for the sender as well
    triggerSosAlert({ triggeredBy: user.id });
  };

  return (
    <div className={`dashboard-container ${sosActive ? 'sos-mode' : ''}`}>
      {sosActive && (
        <div className="sos-banner">
          <h1>{sosMessage}</h1>
          <button onClick={() => setSosActive(false)} className="sos-dismiss-btn">DISMISS</button>
        </div>
      )}
      
      <nav className="dashboard-nav">
        <h2>FamilyConnect</h2>
        {(!isMobile && inviteCode) && (
          <div className="invite-code-display">
            Invite Code: <strong>{inviteCode}</strong>
          </div>
        )}
        <div className="nav-actions">
          {isMobile && (
            <>
              <button 
                className={`btn-nav-mobile ${activePanel === 'directory' ? 'active' : ''}`}
                onClick={() => setActivePanel(activePanel === 'directory' ? 'none' : 'directory')}
              >
                👥
              </button>
              <button 
                className={`btn-nav-mobile ${activePanel === 'planner' ? 'active' : ''}`}
                onClick={() => setActivePanel(activePanel === 'planner' ? 'none' : 'planner')}
              >
                🗺️
              </button>
            </>
          )}
          <button 
            className={`btn-location-toggle ${isSharingLocation ? 'active' : ''}`}
            onClick={() => setIsSharingLocation(!isSharingLocation)}
            title={isSharingLocation ? "Broadcasting Location" : "Location Hidden"}
          >
            {isSharingLocation ? '📡 On' : '👻 Off'}
          </button>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="map-wrapper">
        <button 
          className={`btn-map-lock ${isLocationLocked ? 'active' : ''}`}
          onClick={() => setIsLocationLocked(!isLocationLocked)}
          title={isLocationLocked ? "Unlock View" : "Center & Lock on Me"}
        >
          {isLocationLocked ? '🔒' : '🎯'}
        </button>

        {(!isMobile || activePanel === 'planner') && <TripPlanner />}
        
        {/* Family Directory Sidebar */}
        {(!isMobile || activePanel === 'directory') && (
          <div className="family-directory-panel">
            <div className="directory-header">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <div>
                   <h3>📡 Track Everyone</h3>
                   <p>Live Member Status</p>
                 </div>
                 {isMobile && (
                   <button className="panel-close-btn" onClick={() => setActivePanel('none')}>×</button>
                 )}
              </div>
              
              {inviteCode && (
                <div className="directory-invite-box">
                  <span>Family Code: </span>
                  <strong>{inviteCode}</strong>
                </div>
              )}

              <button onClick={handleSosClick} className="sos-btn-full mt-2">
                🚨 SEND EMERGENCY SOS
              </button>
            </div>
            <div className="directory-scroll-content">
              <div className="directory-list">
                {familyMembers.map((member, idx) => {
                  const isMe = member._id === user.id;
                  const color = isMe ? '#0284c7' : COLORS[idx % COLORS.length];
                  
                  const memberLoc = locations[member._id];
                  const finalLoc = isMe && myLocation ? myLocation : memberLoc;
                  
                  let distString = 'Unknown';
                  if (isMe) {
                    distString = '0.00 KM';
                  } else if (myLocation && finalLoc) {
                    const dist = getDistance(myLocation[0], myLocation[1], finalLoc[0], finalLoc[1]);
                    distString = dist !== '?' ? `${dist} KM AWAY` : 'Unknown';
                  }

                  return (
                    <div key={member._id} className="directory-card">
                      <div className="directory-info">
                        <div className="directory-avatar" style={{ backgroundColor: color }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="directory-name">{member.name} {isMe && '(You)'}</h4>
                          <p className={`directory-distance ${isMe ? 'text-primary' : ''}`}>
                            {distString}
                          </p>
                        </div>
                      </div>
                      {!isMe && (
                        <a href={`tel:${member.phone}`} className="directory-call-btn">
                          📞 Call
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <MapContainer 
          center={myLocation || [0, 0]} 
          zoom={2} 
          scrollWheelZoom={true} 
          className="leaflet-map-container"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {myLocation && <MapUpdater center={myLocation} isLocked={isLocationLocked} />}
          
          {/* Render Members */}
          {familyMembers.map((member, idx) => {
            // Priority: Real-time socket location > DB location > null
            const memberLoc = locations[member._id];
            if (!memberLoc) return null;

            const isMe = member._id === user.id;
            // For own user, use high accuracy myLocation state if available
            const finalLoc = isMe && myLocation ? myLocation : memberLoc;
            const color = isMe ? '#0284c7' : COLORS[idx % COLORS.length];

            return (
              <Marker 
                key={member._id} 
                position={finalLoc} 
                icon={createTeardropIcon(member.name, color)}
              >
                <Popup className="custom-popup">
                  <strong>{member.name} {isMe && '(You)'}</strong><br/>
                  Phone: {member.phone}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default DashboardPage;
