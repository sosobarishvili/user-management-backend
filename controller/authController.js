const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');
const { sendResetEmail } = require('../services/mailService');

const prisma = new PrismaClient();

exports.register = async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase().trim();
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Please enter all fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword,
        lastLogin: new Date(),
        status: 'ACTIVE'
      },
      select: { id: true, name: true, email: true }
    });
    res.status(201).json({ ...user, token: generateToken(user.id) });
  } catch (error) {
    if (error.code === 'P2002')
      return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const { password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Please enter all fields' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'BLOCKED')
      return res.status(403).json({ message: 'Account blocked' });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.json({ id: user.id, name: user.name, email: user.email, token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ message: 'Reset link sent if account exists' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken: hashedToken, passwordResetExpires: expires }
    });

    await sendResetEmail(user.email, rawToken);
    res.status(200).json({ message: 'Reset link sent if account exists' });

  } catch (err) {
    await prisma.user.update({
      where: { email },
      data: { passwordResetToken: null, passwordResetExpires: null }
    }).catch(() => { });
    res.status(500).json({ error: 'Failed to send email' });
  }
};

exports.resetPassword = async (req, res) => {
  const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const { password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user)
      return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null }
    });

    res.status(200).json({ message: 'Password reset successful' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};