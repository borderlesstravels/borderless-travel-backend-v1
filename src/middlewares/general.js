const Notification = require("../models/general/Notification");
const { sendError } = require("../utils/helpers");

// const saveNotification = async (req, res, next) => {
//   const { owner, type, title, description, message } = req.body;
//   try {
//     const newNot = new Notification({
//       owner,
//       type,
//       title,
//       description,
//     });
//     await newNot.save();
//     next();
//   } catch (error) {
//     console.log(error);
//     return sendError(
//       res,
//       `${message}. Unable to send notification. Something went wrong`
//     );
//   }
// };

module.exports = {
  //   saveNotification,
};
