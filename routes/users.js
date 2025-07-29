const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', protect, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        lastLogin: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        status: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

router.post('/manage', protect, async (req, res) => {
  const { action, userIds } = req.body;

  if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid request body: action and userIds are required.' });
  }

  try {
    if (action === 'BLOCK') {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: 'BLOCKED' },
      });
      res.json({ message: 'Users blocked successfully.' });
    } else if (action === 'UNBLOCK') {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: 'ACTIVE' },
      });
      res.json({ message: 'Users unblocked successfully.' });
    } else if (action === 'DELETE') {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
      res.json({ message: 'Users deleted successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid action specified.' });
    }
  } catch (error) {
    console.error('Error processing user management action:', error);
    res.status(500).json({ message: 'Server error processing your request.' });
  }
});

module.exports = router;
