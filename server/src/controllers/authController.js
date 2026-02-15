const bcrypt = require("bcryptjs");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { hashTokenId } = require("../services/tokenService");

function buildTokenResponse(user) {
  const accessToken = signAccessToken(user);
  const refreshPayload = signRefreshToken(user);
  return { accessToken, refreshPayload };
}

async function persistRefreshToken(userId, tokenId, decodedExp) {
  const expiresAt = new Date(decodedExp * 1000);
  await RefreshToken.create({
    user: userId,
    tokenId: hashTokenId(tokenId),
    expiresAt,
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const { accessToken, refreshPayload } = buildTokenResponse(user);
    const decoded = verifyRefreshToken(refreshPayload.token);
    await persistRefreshToken(user._id, refreshPayload.jti, decoded.exp);

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken: refreshPayload.token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // TODO: Implement extended token expiration when rememberMe is true
    // For now, tokens have the same expiration regardless of rememberMe
    // In production, you could extend refreshTokenTtl to 30d when rememberMe is true

    const { accessToken, refreshPayload } = buildTokenResponse(user);
    const decoded = verifyRefreshToken(refreshPayload.token);
    await persistRefreshToken(user._id, refreshPayload.jti, decoded.exp);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken: refreshPayload.token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenIdHash = hashTokenId(payload.jti);

    const tokenDoc = await RefreshToken.findOne({
      user: payload.sub,
      tokenId: tokenIdHash,
      revoked: false,
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    tokenDoc.revoked = true;
    await tokenDoc.save();

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { accessToken, refreshPayload } = buildTokenResponse(user);
    const decoded = verifyRefreshToken(refreshPayload.token);
    await persistRefreshToken(user._id, refreshPayload.jti, decoded.exp);

    return res.json({
      accessToken,
      refreshToken: refreshPayload.token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(204).send();
    }

    const payload = verifyRefreshToken(refreshToken);
    await RefreshToken.updateOne(
      { user: payload.sub, tokenId: hashTokenId(payload.jti) },
      { $set: { revoked: true } },
    );

    return res.status(204).send();
  } catch (_error) {
    return res.status(204).send();
  }
};

exports.me = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen,
    },
  });
};