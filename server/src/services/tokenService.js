const crypto = require("crypto");

function hashTokenId(tokenId) {
  return crypto.createHash("sha256").update(tokenId).digest("hex");
}

module.exports = { hashTokenId };