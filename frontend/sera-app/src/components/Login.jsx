import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
const { user, login, signup, logout} = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "parent",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const data = await login(formData.username, formData.password);
      setMessage(data.message);

      setFormData({
        username: "",
        password: "",
        role: "parent"});
  } catch (error) {
    setMessage(error.message|| "Login Failed");
  } finally {
    setIsLoading(false);
  }
}

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const data = await signup(formData.username, formData.password, formData.role);
      setMessage(data.message);

      setFormData({
        username: "",
        password: "",
        role: "parent"});
  } catch (error) {
    setMessage(error.message|| "Signup Failed");
  } finally {
    setIsLoading(false);
  }
};

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await logout();

      setMessage("Logged out successfully");
  } catch (error) {
    setMessage(error.message|| "Logout Failed");
  } finally {
    setIsLoading(false);
  }
};

  if (user) {
    return (
      <div className="login-container">
        <h1>Welcome to Sera, {user.username}!</h1>
        <div className="user-info">
          <p>Role: {user.role}</p>
          <p>User ID: {user.id}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="logout-btn"
        >
          {isLoading ? "Logging out..." : "Logout"}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>Welcome to Sera!</h1>
      <form className="container">
        <label htmlFor="username">Please log in or create a new user:</label>
        <input
          id="username"
          name="username"
          placeholder="Type username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <input
          name="password"
          placeholder="Type password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <label htmlFor="role">Select a role: </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleInputChange}
        >
          <option value="parent">Parent</option>
          <option value="student">Student</option>
          <option value="organize">Organizer</option>
        </select>
        <button
          name="register"
          onClick={handleSignup}
          disabled={isLoading || !formData.username || !formData.password}
        >
          {isLoading ? "Creating..." : "Register"}
        </button>
        <button
          name="login"
          onClick={handleLogin}
          disabled={isLoading || !formData.username || !formData.password}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
