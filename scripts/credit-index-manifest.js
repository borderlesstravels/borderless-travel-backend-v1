// Offline schema manifest only: no database connection or index mutations.
const names = [
  "CreditIntent",
  "CreditEvent",
  "CreditPayloadArchive",
  "CreditLink",
  "CreditFundingReview",
  "CreditFareReview",
  "CreditAllocation",
  "CreditReservation",
  "CreditReviewNote",
  "PaymentReceipt",
];
const manifest = names.map((name) => {
  const model = require("../src/models/general/" + name);
  return {
    model: name,
    collection: model.collection.name,
    indexes: [
      { keys: { _id: 1 }, options: { unique: true } },
      ...model.schema.indexes().map(([keys, options]) => ({ keys, options })),
    ],
  };
});
process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
