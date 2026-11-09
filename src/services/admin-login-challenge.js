const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Token = require("../models/admin/AdminLoginToken");
const { PaymentError } = require("./payment-integrity");
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const credentialDigest = admin => hash(JSON.stringify([admin.password, admin.email, admin.email_verified, admin.auth_version || 0]));
const otp = () => String(crypto.randomInt(1000, 10000));

function challengeFilter(admin, challenge) {
  const match = typeof challenge === "string" && /^([a-f0-9]{24})\.([A-Za-z0-9_-]{43})$/.exec(challenge);
  if (!match || !admin.email_verified) throw new PaymentError("Please start again with your admin password", 401);
  return { _id: match[1], owner: admin._id, challenge_hash: hash(match[2]),
    credential_digest: credentialDigest(admin), expires_at: { $gt: new Date() } };
}

async function startAdminChallenge(admin) {
  if (!admin.email_verified || !admin.password) throw new PaymentError("Admin account is not verified", 401);
  const secret = crypto.randomBytes(32).toString("base64url"), code = otp();
  const token = await Token.create({ owner: admin._id, token: bcrypt.hashSync(code, 10),
    challenge_hash: hash(secret), credential_digest: credentialDigest(admin), expires_at: new Date(Date.now() + 900000) });
  return { otp: code, login_challenge: `${token._id}.${secret}` };
}

async function resendAdminChallenge(admin, challenge) {
  const filter = challengeFilter(admin, challenge);
  const previous = await Token.findOne(filter);
  if (!previous) throw new PaymentError("Login challenge has expired or already been used", 401);
  const code = otp();
  const updated = await Token.findOneAndUpdate({ ...filter, token: previous.token },
    { $set: { token: bcrypt.hashSync(code, 10) } }, { new: true });
  if (!updated) throw new PaymentError("Login challenge has changed. Please try again.", 409);
  // Resending never extends the original password challenge deadline.
  return { otp: code, login_challenge: challenge };
}

async function consumeAdminChallenge(admin, challenge, code) {
  if (typeof code !== "string" || !/^\d{4}$/.test(code)) throw new PaymentError("Invalid login code", 401);
  const filter = challengeFilter(admin, challenge);
  const token = await Token.findOne(filter);
  if (!token || !bcrypt.compareSync(code, token.token)) throw new PaymentError("Invalid or expired login verification", 401);
  const consumed = await Token.findOneAndDelete({ ...filter, token: token.token });
  if (!consumed) throw new PaymentError("Login challenge has expired or already been used", 401);
}

module.exports = { startAdminChallenge, resendAdminChallenge, consumeAdminChallenge };
