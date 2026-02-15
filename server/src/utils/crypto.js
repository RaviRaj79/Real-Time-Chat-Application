const crypto = require("crypto");
const config = require("../config/env");

function buildKey() {
  return crypto.createHash("sha256").update(config.aesSecret).digest();
}

function encryptText(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", buildKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);

  return {
    iv: iv.toString("hex"),
    encryptedContent: encrypted.toString("hex"),
  };
}

function decryptText(encryptedContent, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedContent, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", buildKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

module.exports = { encryptText, decryptText };