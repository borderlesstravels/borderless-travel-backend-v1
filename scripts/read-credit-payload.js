"use strict";

// Read-only one-off decryptor for a short-lived, encrypted webhook archive.
const mongoose = require("mongoose");
const crypto = require("node:crypto");

function secret(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this command directly in an interactive terminal."));
      return;
    }
    let value = "";
    const restore = () => {
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.setEncoding("utf8");
      process.stdout.write("\n");
    };
    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") { restore(); return reject(new Error("Cancelled.")); }
        if (char === "\r" || char === "\n") { restore(); return resolve(value); }
        if (char === "\u007f" || char === "\b") { value = value.slice(0, -1); continue; }
        if (char >= " " && value.length < 4096) { value += char; process.stdout.write("*"); }
      }
    };
    input.on("data", onData);
  });
}

async function main() {
  const loanReference = process.argv[2];
  const event = process.argv[3] || "loan.approved";
  if (!loanReference || !/^[A-Za-z0-9_-]{1,80}$/.test(loanReference) || !/^loan\.[a-z_]+$/.test(event))
    throw new Error("Usage: npm.cmd run inspect:credit-payload -- <loan-reference> [event]");
  let uri = await secret("MongoDB URI (input hidden): ");
  const encodedKey = await secret("Temporary capture key (input hidden): ");
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey)
    throw new Error("Capture key must be a 32-byte base64 value.");
  await mongoose.connect(uri, { autoIndex: false, bufferCommands: false, maxPoolSize: 1, serverSelectionTimeoutMS: 10000 });
  uri = "";
  const rows = await mongoose.connection.db.collection("creditpayloadarchives")
    .find({ loanReference, event, expiresAt: { $gt: new Date() } })
    .sort({ receivedAt: -1 }).limit(5).toArray();
  if (!rows.length) { process.stdout.write("No unexpired captured payload found.\n"); return; }
  const answer = await new Promise((resolve) => {
    const rl = require("node:readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Found ${rows.length} encrypted payload(s). Type SHOW to print sensitive payload content: `, (value) => { rl.close(); resolve(value.trim()); });
  });
  if (answer !== "SHOW") { process.stdout.write("Cancelled.\n"); return; }
  for (const row of rows) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(row.iv, "base64"));
    decipher.setAuthTag(Buffer.from(row.authTag, "base64"));
    const clear = Buffer.concat([decipher.update(Buffer.from(row.ciphertext, "base64")), decipher.final()]);
    process.stdout.write(`\nReceived ${row.receivedAt.toISOString()} (${row.event}):\n`);
    process.stdout.write(JSON.stringify(JSON.parse(clear.toString("utf8")), null, 2) + "\n");
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message || "Lookup failed."}\n`);
  process.exitCode = 1;
}).finally(async () => { await mongoose.disconnect().catch(() => {}); });
