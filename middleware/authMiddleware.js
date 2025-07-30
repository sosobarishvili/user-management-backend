const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  const isUsersGetRequest = (req.method === 'GET' && req.originalUrl === '/api/users');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, status: true },
      });

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      if (!isUsersGetRequest && user.status === 'BLOCKED') {
        return res.status(403).json({ message: 'Your account has been blocked. Please log in again.' });
      }

      req.user = user;
      next();

    } catch (error) {
      console.error('Authentication error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired. Please log in again.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, invalid token. Please log in again.' });
      }
      res.status(401).json({ message: 'Not authorized, token failed. Please log in again.' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protect };
