import { useState } from "react";
import "./css/App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import Login from "./components/Login";
import EventList from "./components/EventList";
import Calendar from "./components/Calendar";
import Profile from "./components/Profile";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="App">
        <header className="banner">
          <div className="link-container">
            <Link to={`/calendar`}>Calendar page</Link>
            <Link to={`/events`}>Event List page</Link>
            <Link to={`/profile`}>Profile page</Link>
            <Link to={`/`}>Return to Login</Link>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/events" element={<EventList />}></Route>
          <Route path="/calendar" element={<Calendar />}></Route>
          <Route path="/profile" element={<Profile />}></Route>
        </Routes>
        <footer>Sera for a better future</footer>
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
