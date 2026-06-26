const mongoose = require('mongoose');
const AgentApplication = require('../src/models/agent/AgentApplication');

const backfillAgentBalances = async () => {
  try {
    const result = await AgentApplication.updateMany(
      { available_balance: { $exists: false } },
      { $set: { available_balance: 0 } }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `Backfilled available_balance for ${result.modifiedCount} agent record(s)`
      );
    }
  } catch (err) {
    console.log('Agent balance backfill failed:', err);
  }
};

const connect = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log('Server has been connected to database');
      await backfillAgentBalances();
    })
    .catch((err) => console.log(err));
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Database disconnected');
});
mongoose.connection.on('connected', () => {
  console.log('MongoDB Database now connected!');
});

module.exports = {
  connect,
};
