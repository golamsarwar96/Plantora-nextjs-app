const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Helper to read users
const readUsers = () => {
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
};

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const users = readUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    id: 'u' + (users.length + 1),
    name,
    email,
    password, // Storing plain for mock
    role: 'user',
    joinedDate: new Date().toISOString(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    bio: '',
    location: ''
  };

  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar
    }
  });
});

// Get Current User
router.get('/me', authenticateToken, (req, res) => {
  const users = readUsers();
  // Firebase UID won't match old JSON ids — fall back to email match
  const user = users.find(u => u.id === req.user.id || u.email === req.user.email);

  if (!user) {
    // Return a basic profile from the Firebase token if user not in local DB
    return res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user',
    });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;
