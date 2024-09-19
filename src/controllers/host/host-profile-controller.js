const jwt = require('jsonwebtoken');
const Host = require('../../models/host/Host');
const ShortLet = require('../../models/host/ShortLet');
const { sendError } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');

const getHost = async (req, res, next) => {
  const userId = req.id;
  let host;
  try {
    host = await Host.findById(userId, '-password');
    if (!host) {
      return sendError(res, 'Profile not found');
    }
    return res.status(200).json({
      success: true,
      data: host,
    });
  } catch (err) {
    next(err);
    // return sendError(res, 'Cannot fetch user profile', 500);
  }
};

const updateHostProfile = async (req, res, next) => {
  const userId = req.id;
  try {
    const host = await Host.findByIdAndUpdate(userId, { $set: req.body }, { new: true });
    return res.status(200).json({
      success: true,
      message: 'Your profile data has been successfully updated',
      data: host,
    });
  } catch (error) {
    console.log(err);
    return sendError(res, 'Unable to update your profile data');
  }
};

const updateHostPassword = async (req, res, next) => {
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;

  const host = await Host.findById(userId);
  if (!host) return sendError(res, 'Invalid host profile');

  const isCurrentPasswordCorrect = bcrypt.compareSync(oldPassword, host.password);
  if (!isCurrentPasswordCorrect) return sendError(res, 'Incorrect current password provided', 204);

  const isPasswordSame = bcrypt.compareSync(newPassword, host.password);
  if (isPasswordSame)
    return sendError(res, 'New password must be different from the old password', 205);

  const hashedPassword = bcrypt.hashSync(newPassword);
  host.password = hashedPassword;

  try {
    await host.save();
    req.body = {
      user: {
        first_name: host.contact_first_name,
        email: host.contact_email,
      },
    };
    next();
  } catch (error) {
    return sendError(res, 'Cannot update your password');
  }
};

const setHostProfileAvatar = async (req, res) => {
  const rawImagesArray = req.files['avatar'];
  if (!rawImagesArray) {
    return badRequestError(res, 'Please add the image avatar to be uploaded');
  }
  const namedImage = rawImagesArray.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, '');
  const avatar = formmatedImages.replace(/[,]/g, ', ');
  console.log('avatar: ', avatar);

  try {
    const savedHostProfile = await Host.findByIdAndUpdate(req.params.id, {
      avatar: avatar,
    });
    return sendSuccess(res, 'Successfully updated the profile avatar', savedHostProfile);
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to update the admin profile');
  }
};

const addProperty = async (req, res, next) => {
  const rawImagesArray = req.files && req.files['images'];
  const namedImage = rawImagesArray?.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages?.replace(/[^a-zA-Z0-9_.,]/g, '');
  const images = formmatedImages?.replace(/[,]/g, ', ');
  req.body.images = images;
  req.body.owner = req.id;
  console.log('req body', req.body);
  console.log('images', images);
  // return res.status(200).json({ message: 'Successful' });
  const property = new ShortLet(req.body);

  try {
    await property.save();
    res.status(200).json({
      success: true,
      message: `Successfully added a new property - ${req.body.apartment_name}`,
      data: property,
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to add a new property');
  }
};

// **
// **
// Auth
const isHostLogin = async (req, res) => {
  const cookies = req.headers.cookie;
  console.log('Session check cookie: ', cookies);
  if (cookies) {
    return res.status(200).json({ success: true, message: 'You are a logged in user' });
  } else if (!cookies) {
    return sendError(res, 'No session found. You are not logged in');
  }
};

const logoutHost = (req, res, next) => {
  console.log('Logout api called');
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(res, 'No cookie found.  You are never logged in to begin with', 401);
  }
  const token = cookies.split('=')[1];
  console.log(token);
  if (!token) {
    return sendError(res, 'No token found.  You are never logged in to begin with', 401);
  }
  jwt.verify(String(token), process.env.JWT_HOST_SECRET_KEY, (err, host) => {
    if (err) {
      return sendError(res, 'Invalid Token.', 401);
    }
    res.clearCookie(`${host.id}`);
    req.cookies[`${host.id}`] = '';
    return res.status(200).json({ success: true, message: 'Successfully logged out' });
  });
};

module.exports = {
  getHost,
  updateHostProfile,
  setHostProfileAvatar,
  updateHostPassword,
  addProperty,

  isHostLogin,
  logoutHost,
};
