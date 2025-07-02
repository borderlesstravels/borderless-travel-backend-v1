const VerificationToken = require("../../models/user/VerificationToken");
const bcrypt = require("bcryptjs");
const {
  sendError,
  generateOTP,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");
const Admin = require("../../models/admin/Admin");
const { log } = require("console");
const AdminRole = require("../../models/app-core/AdminRole");

const addAdmin = async (req, res, next) => {
  const { first_name, last_name, email, phone, role, username } = req.body;

  const password = `${first_name.toLowerCase().toString()}pass`;
  log("password:", password);

  const hashedPassword = bcrypt.hashSync(password);
  const admin = new Admin({
    first_name,
    last_name,
    email,
    phone,
    role,
    username,
    password: hashedPassword,
  });

  try {
    await admin.save();
    console.log("Admin successfully added");
    req.body = {
      userId: admin._id,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to sign up");
  }
};

const generateAdminEmailVerificationToken = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return sendError(res, "Invalid request. Missing parameters");
  }
  let existingVerificationToken;
  const admin = await Admin.findById(userId, "-password");

  if (admin.email_verified)
    return sendError(res, "Account's email is already verified");

  try {
    existingVerificationToken = await VerificationToken.findOne({ userId });
  } catch (error) {
    console.log(error);
  }
  if (existingVerificationToken) {
    await VerificationToken.findByIdAndDelete(existingVerificationToken._id);
  }

  const otp = generateOTP();
  const hashedOtp = bcrypt.hashSync(otp);

  const verificationToken = new VerificationToken({
    owner: userId,
    token: hashedOtp,
  });

  try {
    await verificationToken.save();
    console.log("Email verification OTP generated");
    req.body = {
      user: admin,
      otp,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to generate email verification OTP");
  }
};

const updateAdminProfile = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password);
  }
  try {
    const savedAdminProfile = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Successfully updated the admin profile",
      data: savedAdminProfile,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update the admin profile");
  }
};

const setProfileAvatar = async (req, res) => {
  const rawImagesArray = req.files["avatar"];
  if (!rawImagesArray) {
    return badRequestError(res, "Please add the image avatar to be uploaded");
  }
  const namedImage = rawImagesArray.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, "");
  const avatar = formmatedImages.replace(/[,]/g, ", ");
  console.log("avatar: ", avatar);

  try {
    const savedAdminProfile = await Admin.findByIdAndUpdate(req.params.id, {
      avatar: avatar,
    });
    return sendSuccess(
      res,
      "Successfully updated the profile avatar",
      savedAdminProfile
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update the admin profile");
  }
};

const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Successfully deleted the admin profile",
    });
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to delete the admin profile");
  }
};

const fetchAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().limit(req.query.limit);
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the admins data");
  }
};

const fetchSingleAdmin = async (req, res, next) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findById(id, "-password");
    if (!admin) {
      return sendError(res, "Admin data does not exist");
    }
    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return sendError(res, "Unable to fetch the admin profile data");
  }
};

// Admin roles
const addAdminRole = async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return sendError(res, "Role Title is missing", 401);
  }
  let existingRole;
  try {
    existingRole = await AdminRole.findOne({ title });
    if (existingRole) {
      return sendError(res, "Admin Role has already been added.");
    }
  } catch (error) {
    return sendError(res, "Could not verify that you are adding a new role");
  }
  const adminRole = new AdminRole(req.body);
  try {
    await adminRole.save();
    return sendSuccess(
      res,
      "New Admin Role has been successfully added",
      adminRole
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to add Admin Role");
  }
};

const updateAdminRole = async (req, res) => {
  try {
    const savedRole = await AdminRole.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(res, "Successfully updated the Admin Role", savedRole);
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update the admin role");
  }
};

const deleteAdminRole = async (req, res) => {
  try {
    await AdminRole.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the Admin Role");
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to delete the Admin Role");
  }
};

const fetchAdminRoles = async (req, res) => {
  try {
    const adminRoles = await AdminRole.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched Admin Role", adminRoles);
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch Admins Roles");
  }
};

const fetchSingleAdminRole = async (req, res) => {
  try {
    const adminRole = await AdminRole.findById(req.params.id);
    if (!adminRole) {
      return sendError(res, "Admin Role data does not exist");
    }
    return sendSuccess(res, "Successfuly fetched the data", adminRole);
  } catch (error) {
    return sendError(res, "Unable to fetch the data");
  }
};

module.exports = {
  addAdmin,
  generateAdminEmailVerificationToken,
  updateAdminProfile,
  setProfileAvatar,
  deleteAdmin,
  fetchAllAdmins,
  fetchSingleAdmin,

  // Admin roles
  addAdminRole,
  updateAdminRole,
  deleteAdminRole,
  fetchAdminRoles,
  fetchSingleAdminRole,
};
