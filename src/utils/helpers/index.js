const crypto = require("crypto");
const User = require("../../models/user/User");
const Notification = require("../../models/general/Notification");
const {
  notificationTemp,
} = require("../../../public/email-templates/profile/notification.temp");
const sendEmail = require("../email/sendEmail.util");
const APIToken = require("../../models/app-core/APIToken");

exports.sendError = (res, error, status = 401) => {
  return res.status(status).json({ success: false, error });
};
exports.badRequestError = (res, error, status = 400) => {
  return res.status(status).json({ success: false, error });
};
exports.sendLoginError = (res, error, loginStatus = 0, status = 401) => {
  return res.status(status).json({ success: false, loginStatus, error });
};
exports.sendSuccess = (res, message, data = null, status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

exports.createRandomBytes = (num) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(num, (err, buff) => {
      if (err) reject(err);
      const token = buff.toString("hex");
      resolve(token);
    });
  });

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
exports.generateString = (length) => {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

exports.generateOTP = () => {
  let otp = "";
  for (let i = 0; i <= 3; i++) {
    const randVal = Math.round(Math.random() * 9);
    otp = otp + randVal;
  }
  return otp;
};

exports.formatCurrency = (value) => {
  return value.toLocaleString("en-US", { style: "currency", currency: "NGN" });
};

exports.checkUserEmailReg = async (email) => {
  let existingUser;
  try {
    existingUser = await User.findOne({ email }, "-password");
    console.log("User exists: ", existingUser);
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
    ""
  );
  const slug = sanitisedTitle.split(" ").join("-").toLowerCase();
  return slug;
};

exports.saveNotification = async (
  owner,
  type,
  title,
  description,
  user,
  apartment_id = null,
  booking_id = null
) => {
  try {
    const newNot = new Notification({
      owner,
      type,
      title,
      description,
      apartment_id,
      booking_id,
    });
    const notificationSent = await newNot.save();
    if (notificationSent) {
      const email = user.email;
      const firstName = user.first_name;
      const send_to = email;
      const email_body = notificationTemp(firstName, description);
      try {
        sendEmail(title, email_body, send_to);
        return true;
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.verifyAPIToken = async (res, firm, api_key) => {
  if (!firm || !api_key) {
    return res.status(401).json({
      success: false,
      error:
        "Credentials missing! You are not authorised to perform this request",
    });
  }
  const validateAPIKey = await APIToken.findOne({ firm });
  if (!validateAPIKey) {
    return res.status(401).json({
      success: false,
      error: "Credential does not exist! Not authorised",
    });
  }
  if (validateAPIKey.api_key !== api_key) {
    return res.status(401).json({
      success: false,
      error:
        "Invalid credentials! You are not authorised to perform this request",
    });
  }
};
