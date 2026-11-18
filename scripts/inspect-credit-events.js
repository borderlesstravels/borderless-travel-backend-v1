"use strict";

// One-off, read-only local lookup. The MongoDB URI is requested from a TTY,
// masked, and never written to disk, an environment variable, or log output.
const mongoose = require("mongoose");

const COLLECTION = "creditevents";
const PAGE_SIZE = 100;
const READ_ACTIONS = new Set(["find"]);
const VALID_DATABASE_NAME = /^[A-Za-z0-9_.-]{1,63}$/;

function readLine(prompt) {
  return new Promise((resolve, reject) => {
    const readline = require("node:readline");
    const interface_ = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    interface_.question(prompt, (answer) => {
      interface_.close();
      resolve(answer.trim());
    });
  });
}

function readMasked(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal."));
      return;
    }

    const originalEncoding = input.readableEncoding;
    const wasPaused = input.isPaused();
    let value = "";
    let finished = false;
    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();

    const restore = () => {
      if (finished) return;
      finished = true;
      input.removeListener("data", onData);
      input.setRawMode(false);
      if (originalEncoding) input.setEncoding(originalEncoding);
      if (wasPaused) input.pause();
      process.stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          restore();
          value = "";
          reject(new Error("Cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          restore();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " " && character !== "\u007f") {
          if (value.length >= 4096) continue;
          value += character;
          process.stdout.write("*");
        }
      }
    };

    input.on("data", onData);
  });
}

function getDatabaseName(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("The MongoDB URI is invalid.");
  }
  if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
    throw new Error("Use a mongodb:// or mongodb+srv:// URI.");
  }
  if (
    parsed.protocol === "mongodb:" &&
    parsed.searchParams.get("tls") !== "true" &&
    parsed.searchParams.get("ssl") !== "true"
  ) {
    throw new Error("Use TLS: mongodb+srv://, or add tls=true to a mongodb:// URI.");
  }
  return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
}

async function listAuthorizedDatabases(connection) {
  const result = await connection.db.admin().command({
    listDatabases: 1,
    nameOnly: true,
    authorizedDatabases: true,
  });
  return (result.databases || [])
    .map((entry) => entry.name)
    .filter((name) => name && !["admin", "local"].includes(name));
}

function verifyReadOnlyScope(connection, database) {
  return connection.db.admin().command({
    connectionStatus: 1,
    showPrivileges: true,
  }).then((result) => {
    const authInfo = result.authInfo || {};
    const roles = authInfo.authenticatedUserRoles || [];
    const privileges = authInfo.authenticatedUserPrivileges || [];
    if (!roles.length || !privileges.length) {
      throw new Error("MongoDB did not report effective read-only permissions.");
    }
    return privileges.every((privilege) => {
      const resource = privilege.resource || {};
      const actions = privilege.actions || [];
      return resource.db === database &&
        resource.collection === COLLECTION &&
        actions.length > 0 &&
        actions.every((action) => READ_ACTIONS.has(action));
    });
  });
}

function safeRows(events) {
  return events.map((event) => ({
    occurredAt: event.occurredAt ? new Date(event.occurredAt).toISOString() : "",
    event: event.event || "",
    disposition: event.disposition || "",
    loanReference: event.loanReference || "",
    providerStatus: event.providerStatus || "",
  }));
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this command directly in an interactive terminal.");
  }
  let uri = await readMasked("MongoDB URI (input hidden): ");
  if (!uri) throw new Error("A MongoDB URI is required.");
  let database = getDatabaseName(uri);
  const uriDatabase = database;
  process.stdout.write(
    uriDatabase
      ? `Connecting to ${database}; checking read-only scope...\n`
      : "URI has no database name; connecting to discover accessible database names...\n",
  );

  try {
    await mongoose.connect(uri, {
      dbName: database || "test",
      autoIndex: false,
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    });
    uri = "";

    if (!database) {
      let names = [];
      try {
        names = await listAuthorizedDatabases(mongoose.connection);
      } catch {
        // Fall back to a manual database name; never show the driver error.
      }
      if (names.length === 1) {
        [database] = names;
        process.stdout.write(`Using the only database this account can access: ${database}\n`);
      } else if (names.length > 1) {
        process.stdout.write(`Accessible database names only: ${names.join(", ")}\n`);
        database = await readLine("Database to inspect: ");
        if (!names.includes(database)) throw new Error("Choose one of the listed database names.");
      } else {
        database = await readLine("Database name (not a password): ");
        if (!VALID_DATABASE_NAME.test(database)) throw new Error("Enter a valid database name.");
      }
    }

    const leastPrivilege = await verifyReadOnlyScope(mongoose.connection, database);
    if (!leastPrivilege) {
      process.stdout.write(
        `This MongoDB account has broader access than find on ${database}.${COLLECTION}. ` +
        "This utility will still issue only read queries to that collection.\n",
      );
      const answer = await readLine("For this one-time lookup, type READ to continue: ");
      if (answer !== "READ") throw new Error("Lookup cancelled.");
    }

    let beforeId;
    let page = 0;
    while (true) {
      const filter = beforeId ? { _id: { $lt: beforeId } } : {};
      const events = await mongoose.connection.client
        .db(database)
        .collection(COLLECTION)
        .find(filter, {
          projection: {
            event: 1,
            disposition: 1,
            loanReference: 1,
            occurredAt: 1,
            providerStatus: 1,
          },
        })
        .sort({ _id: -1 })
        .limit(PAGE_SIZE)
        .toArray();

      if (!events.length) {
        process.stdout.write(
          page === 0
            ? `No credit events found in ${database}.\n`
            : "End of events.\n",
        );
        break;
      }

      page += 1;
      process.stdout.write(`\nCredit events, page ${page} (newest first; ${events.length} shown):\n`);
      console.table(safeRows(events));
      if (events.length < PAGE_SIZE) break;

      const next = (await readLine("Show the next page? [y/N] ")).toLowerCase();
      if (next !== "y") break;
      beforeId = events[events.length - 1]._id;
    }
  } finally {
    uri = "";
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error) => {
  // Never print driver errors: they can contain hostnames or connection details.
  process.stderr.write(`${error.message || "Lookup failed."}\n`);
  process.exitCode = 1;
});
