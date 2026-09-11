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

exports.createRandomBytes = async (num) => {
  const buff = await crypto.promises.randomBytes(num);
  return buff.toString("hex");
};

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
  const fm = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  });
  return fm.format(value);
};

exports.shuffleArray = (array) => {
  if (array) {
    const newArr = array.slice();
    for (let i = newArr.length - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
    }
    return newArr;
  } else {
    return [];
  }
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
    if (!notificationSent) {
      return false;
    }

    // In-app notification is the source of truth. Email is best-effort so
    // Vercel SMTP failures do not hang booking/decline HTTP responses.
    if (user?.email) {
      try {
        const email_body = notificationTemp(user.first_name, description);
        await sendEmail(title, email_body, user.email);
      } catch (error) {
        console.error("Notification email failed:", error.message || error);
      }
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.verifyAPIToken = async (res, firm, api_key) => {
  if (!firm || !api_key) {
    res.status(401).json({
      success: false,
      error:
        "Credentials missing! You are not authorised to perform this request",
    });
    return false;
  }
  const validateAPIKey = await APIToken.findOne({ firm });
  if (!validateAPIKey) {
    res.status(401).json({
      success: false,
      error: "Credential does not exist! Not authorised",
    });
    return false;
  }
  if (validateAPIKey.api_key !== api_key) {
    res.status(401).json({
      success: false,
      error:
        "Invalid credentials! You are not authorised to perform this request",
    });
    return false;
  }
  return true;
};

exports.dateFormatter = (date) => {
  var dateString = new Date(date).toString();
  var splittedDateString = dateString.split(" ");
  var day2 = splittedDateString[1];
  var month = splittedDateString[2];
  var year = splittedDateString[3];
  var formatttedDate = `${day2} ${month}, ${year}`;
  return formatttedDate;
};
exports.timeFormatter = (date) => {
  var dateString = new Date(date).toString();
  var splittedDateString = dateString.split(" ");
  var time = splittedDateString[4];
  var formatttedTime = `${time}`;
  return formatttedTime;
};
// exports.dateDayFormatter = (date) => {
//   var dateString = new Date(date).toString();
//   var splittedDateString = dateString.split(" ");
//   var day1 = splittedDateString[0];
//   var day2 = splittedDateString[1];
//   var month = splittedDateString[2];
//   var year = splittedDateString[3];
//   var formatttedDate = `${day2} ${month} ${year}`;
//   return formatttedDate;
// };
