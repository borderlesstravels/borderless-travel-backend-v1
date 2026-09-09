const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shortLetSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Host",
    required: true,
  },
  apartment_name: {
    type: String,
    required: [true, "Apartment name is missing"],
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  lga: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },

  images: {
    type: Array,
    required: true,
  },
  single: {
    type: Number,
    default: 0,
  },
  single_price: {
    type: String,
    default: 0,
  },
  suites: {
    type: Number,
    default: 0,
  },
  suites_price: {
    type: String,
    default: 0,
  },
  executive: {
    type: Number,
    default: 0,
  },
  executive_price: {
    type: String,
    default: 0,
  },
  double_chambers: {
    type: Number,
    default: 0,
  },
  double_chambers_price: {
    type: String,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
  bedrooms: {
    type: Number,
    default: 0,
  },
  bathrooms: {
    type: Number,
    default: 0,
  },
  parking: {
    type: Number,
    default: 0,
  },
  pool: {
    type: Number,
    default: 0,
  },
  bathtube: {
    type: Boolean,
    default: false,
  },
  bidet: {
    type: Boolean,
    default: false,
  },
  body_soap: {
    type: Boolean,
    default: false,
  },
  cleaning_products: {
    type: Boolean,
    default: false,
  },
  hot_water: {
    type: Boolean,
    default: false,
  },
  bed_linens: {
    type: Boolean,
    default: false,
  },
  clothing_storage: {
    type: Boolean,
    default: false,
  },
  drying_rack: {
    type: Boolean,
    default: false,
  },
  essentials: {
    type: Boolean,
    default: false,
  },
  extra_pillows: {
    type: Boolean,
    default: false,
  },
  free_dryer: {
    type: Boolean,
    default: false,
  },
  free_washer: {
    type: Boolean,
    default: false,
  },
  hangers: {
    type: Boolean,
    default: false,
  },
  iron: {
    type: Boolean,
    default: false,
  },
  darkening_shades: {
    type: Boolean,
    default: false,
  },
  archade_games: {
    type: Boolean,
    default: false,
  },
  bluetooth: {
    type: Boolean,
    default: false,
  },
  reading: {
    type: Boolean,
    default: false,
  },
  game_console: {
    type: Boolean,
    default: false,
  },
  ping_pong_table: {
    type: Boolean,
    default: false,
  },
  pool_table: {
    type: Boolean,
    default: false,
  },
  tv: {
    type: Boolean,
    default: false,
  },
  ac: {
    type: Boolean,
    default: false,
  },
  fans: {
    type: Boolean,
    default: false,
  },
  monoxide_alarm: {
    type: Boolean,
    default: false,
  },
  fire_extinguisher: {
    type: Boolean,
    default: false,
  },
  first_aid_kit: {
    type: Boolean,
    default: false,
  },
  security_cameras: {
    type: Boolean,
    default: false,
  },
  smoke_alarm: {
    type: Boolean,
    default: false,
  },
  dedicated_workspace: {
    type: Boolean,
    default: false,
  },
  wifi: {
    type: Boolean,
    default: false,
  },
  bbq_grill: {
    type: Boolean,
    default: false,
  },
  outdoor_dining: {
    type: Boolean,
    default: false,
  },
  outdoor_furniture: {
    type: Boolean,
    default: false,
  },
  patio_balcony: {
    type: Boolean,
    default: false,
  },
  backyard_fenced: {
    type: Boolean,
    default: false,
  },
  carpot: {
    type: Boolean,
    default: false,
  },
  street_parking: {
    type: Boolean,
    default: false,
  },
  private_pool: {
    type: Boolean,
    default: false,
  },
  lockbox: {
    type: Boolean,
    default: false,
  },
  self_checkin: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.ShortLet || mongoose.model("ShortLet", shortLetSchema);