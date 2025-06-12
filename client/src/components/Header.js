import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-left ">
        <img src={logo} alt="RCF Pratibha Poshak Academy Logo" className="header-logo" />
        <div className="header-text">
          <h3 className="header-title">Pratibha Poshak Portal</h3>
          <span className="header-subtitle">NGO Administrative System</span>
        </div>
      </div>
      <button className="logout-button" onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Header;
