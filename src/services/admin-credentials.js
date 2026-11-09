const mongoose = require("mongoose");
const Admin = require("../models/admin/Admin");
const Reset = require("../models/admin/ResetAdminPasswordToken");
const Session = require("../models/general/SessionStore");
const Challenge = require("../models/admin/AdminLoginToken");
const { PaymentError } = require("./payment-integrity");

async function resetAdminCredential(id, token, password) {
  if (typeof token !== "string" || !token || token.length > 512) throw new PaymentError("Invalid password reset token", 401);
  const session = await mongoose.startSession();
  let admin;
  try {
    await session.withTransaction(async () => {
      const claimed = await Reset.findOneAndDelete({ owner: id, token,
        createdAt: { $gt: new Date(Date.now() - 600000) } }, { session });
      if (!claimed) throw new PaymentError("Password reset token has expired or already been used", 401);
      admin = await Admin.findByIdAndUpdate(id, { $set: { password }, $inc: { auth_version: 1 } },
        { new: true, runValidators: true, session }).select("-password");
      if (!admin) throw new PaymentError("Admin not found", 404);
      await Session.deleteMany({ owner: String(id) }, { session });
      await Challenge.deleteMany({ owner: id }, { session });
    });
    return admin;
  } finally { await session.endSession(); }
}

async function updateAdminAccount(id, changes, credentialChange) {
  const session = await mongoose.startSession();
  let admin;
  try {
    await session.withTransaction(async () => {
      const update = { $set: changes };
      if (credentialChange) update.$inc = { auth_version: 1 };
      admin = await Admin.findByIdAndUpdate(id, update, { new: true, runValidators: true, session }).select("-password");
      if (!admin) throw new PaymentError("Admin not found", 404);
      if (credentialChange) {
        await Session.deleteMany({ owner: String(id) }, { session });
        await Challenge.deleteMany({ owner: id }, { session });
        await Reset.deleteMany({ owner: id }, { session });
      }
    });
    return admin;
  } finally { await session.endSession(); }
}

module.exports = { resetAdminCredential, updateAdminAccount };
