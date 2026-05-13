const admin = require('firebase-admin');

// Initialize Firebase Admin only once (works without a service account
// for token verification using the project ID)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'plantora-nextjs-app',
  });
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);

    // Map Firebase user to the shape the rest of the app expects
    req.user = {
      id: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email,
      role: decoded.role || 'user', // custom claim if set, defaults to 'user'
    };

    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err.code, err.message);
    return res.status(403).json({ message: 'Token is not valid' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not allowed to access this resource`,
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
