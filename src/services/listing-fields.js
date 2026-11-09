// Explicit host-editable fields. Ownership and administrative state never come
// from multipart/form data, Mongo operators, or dotted client property names.
const FIELDS = (`apartment_name country state lga address email phone website
single single_price suites suites_price executive executive_price double_chambers double_chambers_price
description bedrooms bathrooms parking pool bathtube bidet body_soap cleaning_products hot_water
bed_linens clothing_storage drying_rack essentials extra_pillows free_dryer free_washer hangers iron
darkening_shades archade_games bluetooth reading game_console ping_pong_table pool_table tv ac fans
monoxide_alarm fire_extinguisher first_aid_kit security_cameras smoke_alarm dedicated_workspace wifi
bbq_grill outdoor_dining outdoor_furniture patio_balcony backyard_fenced carpot street_parking
private_pool lockbox self_checkin`).split(/\s+/);

function listingFields(body) {
  const result = {};
  for (const key of FIELDS) {
    if (Object.hasOwn(body || {}, key) && ["string", "number", "boolean"].includes(typeof body[key])) {
      result[key] = body[key];
    }
  }
  return result;
}

module.exports = { listingFields };
