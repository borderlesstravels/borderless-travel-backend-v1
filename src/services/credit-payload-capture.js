const crypto = require("node:crypto");
const Archive = require("../models/general/CreditPayloadArchive");
const { hash } = require("./gotrip");

const RETENTION_MS = 24 * 60 * 60 * 1000;

function captureKeyFromEnv() {
  const value = process.env.GOTRIP_RAW_CAPTURE_KEY || "";
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) return null;
  return key;
}

async function captureRawPayload({ parsed, rawBody }) {
  const target = process.env.GOTRIP_RAW_CAPTURE_REFERENCE;
  if (!target || target !== parsed.loanReference) return false;
  const key = captureKeyFromEnv();
  if (!key || !Buffer.isBuffer(rawBody))
    throw new Error("RAW_CAPTURE_NOT_CONFIGURED");

  await Archive.collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "credit_payload_expiry" },
  );

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(rawBody), cipher.final()]);
  const captureKey = hash(`${parsed.loanReference}:${parsed.event}:${hash(rawBody)}`);
  try {
    await Archive.create({
      captureKey,
      loanReference: parsed.loanReference,
      event: parsed.event,
      receivedAt: new Date(),
      expiresAt: new Date(Date.now() + RETENTION_MS),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return true;
}

module.exports = { captureRawPayload, captureKeyFromEnv };
