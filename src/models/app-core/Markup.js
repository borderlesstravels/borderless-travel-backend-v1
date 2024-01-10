const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const markupSchema = new Schema({
  localFlight: {
    type: Number,
    required: true,
  },
  internationalFlight: {
    type: Number,
    required: true,
  },
  shortlet: {
    type: Number,
    required: true,
  },
  hotel: {
    type: Number,
    required: true,
  },
  cab: {
    type: Number,
    required: true,
  },
  shortlet: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Markup', markupSchema);
