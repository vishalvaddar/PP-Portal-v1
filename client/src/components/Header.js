// src/components/Header.js
import React from 'react';
import './Header.css'; // Import the CSS file for the header
import logo from '../assets/logo.png'; // Adjust the path to your logo image

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="RCF Pratibha Poshak Academy Logo" className="logo" />
        <h1>RCF Pratibha Poshak Academy</h1>
      </div>
    </header>
  );
};

export default Header;
