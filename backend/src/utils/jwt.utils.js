const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = async (userId) => {
  const token     = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
};

const revokeRefreshToken = async (token) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data:  { isRevoked: true },
  });
};

const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data:  { isRevoked: true },
  });
};

module.exports = { generateAccessToken, generateRefreshToken, revokeRefreshToken, revokeAllUserTokens };
