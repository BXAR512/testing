import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch("http://localhost:3000/privacy/settings", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrivacySettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  };

  const updatePrivacySettings = async (newSettings) => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch("http://localhost:3000/privacy/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newSettings),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPrivacySettings(data.settings);
        setMessage("Privacy settings updated successfully!");
      } else {
        setMessage(data.message || "Failed to update privacy settings");
      }
    } catch (error) {
      setMessage("Error updating privacy settings");
      console.error("Error updating privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousToggle = () => {
    if (!privacySettings) return;
    
    const newSettings = {
      isAnon: !privacySettings.isAnon,
      anonUsername: privacySettings.anonUsername,
    };
    
    updatePrivacySettings(newSettings);
  };

  const handleAnonymousUsernameChange = (e) => {
    if (!privacySettings) return;
    
    const newSettings = {
      isAnon: privacySettings.isAnon,
      anonUsername: e.target.value,
    };
    
    updatePrivacySettings(newSettings);
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      
      <div className="profile-info">
        <h2>User Information</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      <div className="privacy-settings">
        <h2>Privacy Settings</h2>
        
        {privacySettings ? (
          <div className="settings-form">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={privacySettings.isAnon}
                  onChange={handleAnonymousToggle}
                  disabled={loading}
                />
                Enable Anonymous Mode
              </label>
              <p className="setting-description">
                When enabled, your name will appear as anonymous in event attendee lists.
              </p>
            </div>

            {privacySettings.isAnon && (
              <div className="setting-item">
                <label>
                  <strong>Anonymous Username:</strong>
                  <input
                    type="text"
                    value={privacySettings.anonUsername || ""}
                    onChange={handleAnonymousUsernameChange}
                    placeholder="Enter anonymous username"
                    disabled={loading}
                  />
                </label>
                <p className="setting-description">
                  This name will be displayed instead of your real username when you're anonymous.
                </p>
              </div>
            )}

            {message && (
              <p className={`message ${message.includes("successfully") ? "success" : "error"}`}>
                {message}
              </p>
            )}
          </div>
        ) : (
          <p>Loading privacy settings...</p>
        )}
      </div>
    </div>
  );
}
