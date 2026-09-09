const mongoose = require("mongoose");
const AgentApplication = require("../src/models/agent/AgentApplication");

/**
 * Serverless-friendly Mongo connection.
 * Reuses the cached connection across warm Vercel invocations.
 */
let cached = global.__borderlessMongo;
if (!cached) {
  cached = global.__borderlessMongo = { conn: null, promise: null, backfilled: false };
}

const backfillAgentBalances = async () => {
  if (cached.backfilled) return;
  try {
    const result = await AgentApplication.updateMany(
      { available_balance: { $exists: false } },
      { $set: { available_balance: 0 } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `Backfilled available_balance for ${result.modifiedCount} agent record(s)`,
      );
    }
    cached.backfilled = true;
  } catch (err) {
    console.log("Agent balance backfill failed:", err);
  }
};

const connect = async () => {
  const uri = process.env.DB_URI;
  if (!uri) {
    throw new Error("DB_URI is not set");
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
      })
      .then(async (mongooseInstance) => {
        console.log("Server has been connected to database");
        await backfillAgentBalances();
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.log(err);
    throw err;
  }

  return cached.conn;
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB Database disconnected");
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB Database now connected!");
});

module.exports = {
  connect,
};
