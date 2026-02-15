const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    config.jwtAccessSecret,
    { expiresIn: config.accessTokenTtl },
  );
}

function signRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      jti,
    },
    config.jwtRefreshSecret,
    { expiresIn: config.refreshTokenTtl },
  );

  return { token, jti };
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};