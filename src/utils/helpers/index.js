const crypto = require('crypto');

exports.sendError = (res, error, status = 401) => {
  res.status(status).json({ success: false, error });
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
