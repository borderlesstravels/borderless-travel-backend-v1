const crypto = require('crypto');
const User = require('../../models/user/User');

exports.sendError = (res, error, status = 401) => {
  res.status(status).json({ success: false, error });
};
exports.badRequestError = (res, error, status = 400) => {
  res.status(status).json({ success: false, error });
};
exports.sendLoginError = (res, error, loginStatus = 0, status = 401) => {
  res.status(status).json({ success: false, loginStatus, error });
};
exports.sendSuccess = (res, message, data = null, status = 200) => {
  res.status(status).json({ success: true, message, data });
};

exports.createRandomBytes = () =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const token = buff.toString('hex');
      resolve(token);
    });
  });

exports.generateOTP = () => {
  let otp = '';
  for (let i = 0; i <= 3; i++) {
    const randVal = Math.round(Math.random() * 9);
    otp = otp + randVal;
  }
  return otp;
};

exports.formatCurrency = (value) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'NGN' });
};

exports.checkUserEmailReg = async (email) => {
  let existingUser;
  try {
    existingUser = await User.findOne({ email }, '-password');
    console.log('User exists: ', existingUser);
    if (existingUser) {
      return existingUser;
    } else {
      return false;
    }
  } catch (err) {
    console.log(`Could not verify email. Err:${err}`);
    return false;
  }
};

exports.generateSlug = (title) => {
  const sanitisedTitle = title.replace(
    /[\\\.\,\+\*\?\^\$\@\#\%\^\&\*\-\_\[\]\(\)\{\}\/\'\#\:\!\=\|]/gi,
    ''
  );
  const slug = sanitisedTitle.split(' ').join('-');
  return slug;
};
