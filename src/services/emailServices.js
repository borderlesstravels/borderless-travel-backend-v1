require("dotenv").config();
const sendEmail = require("../utils/email/sendEmail.util");
const {
  emailVerifiedTemp,
} = require("../../public/email-templates/auth/signup/emailVerified.template");
const {
  passwordUpdatedTemp,
} = require("../../public/email-templates/auth/password/passwordUpdated.template");
const {
  resetPasswordTemp,
} = require("../../public/email-templates/auth/password/resetPassword.template");
const {
  verifyEmailCodeTemp,
} = require("../../public/email-templates/auth/signup/verifyEmailCode.template");
const {
  verifyLoginCodeTemp,
} = require("../../public/email-templates/auth/login/verifyLoginCode.template");
const {
  loginVerifiedTemp,
} = require("../../public/email-templates/auth/login/loginVerified.template");
const {
  profileUpdatedTemp,
} = require("../../public/email-templates/profile/profileUpdated.template");
const {
  contactUsEmailTemp,
} = require("../../public/email-templates/website/contactUsEmailTemp");
const {
  accountAutoCreatedTemp,
} = require("../../public/email-templates/auth/signup/accountAutoCreated.template");
const { sendSuccess, sendError } = require("../utils/helpers");
const {
  waitlistSubscribedTemp,
} = require("../../public/email-templates/website/waitlistSubscribed.template");
const {
  signedUpTemp,
} = require("../../public/email-templates/auth/signup/signedUp.template");
const {
  bookingSuccessfulTemp,
} = require("../../public/email-templates/bookings/bookingSuccessful.template");

const {
  flightTicketIssuedTemp,
} = require("../../public/email-templates/bookings/flightTicketIssued.template");
const {
  flightTicketCancelledTemp,
} = require("../../public/email-templates/bookings/flightTicketCancelled.template");
const {
  apartmentAvailableTemp,
} = require("../../public/email-templates/bookings/apartmentAvailable.template");
const {
  shortletBookingCompletedTemp,
} = require("../../public/email-templates/bookings/shortletBookingCompleted.template");
const {
  flightBookingPaymentRecievedTemp,
} = require("../../public/email-templates/bookings/flightBookingPaymentRecieved.template");
const {
  shortletBookingPaymentRecievedTemp,
} = require("../../public/email-templates/bookings/shortletBookingPaymentRecieved.template");

// Waitlist email
const waitlistSubscribedEMail = async (req, res) => {
  const { subscriber } = req.body;
  const email = subscriber.email;
  const first_name = subscriber.first_name.split(" ")[0];
  const subject = "Welcome to Borderless";
  const email_body = waitlistSubscribedTemp(first_name);
  let emailSent;
  const notitle = true;
  try {
    emailSent = await sendEmail(subject, email_body, email, notitle);
  } catch (error) {
    console.log({ emailError: error });
    return res.status(500).json({
      success: true,
      message:
        "You have successfully joined our wait list. But we are unable to send a feedback at this time.",
    });
  }
  // if (emailSent) {
  return res.status(200).json({
    success: true,
    message:
      "You have successfully joined our wait list. Kindly check your email as have something important for you",
    subscriber,
  });
  // } else {
  //   console.log("something went wrong");
  // }
};

// SignUp - welcome mail is sent with the OTP mail below to avoid sequential SMTP latency on Vercel
const successfulSignupEmail = async (req, res, next) => {
  return next();
};
const accountVerificationEmail = async (req, res) => {
  const { user, otp } = req.body;
  const email = user.email;
  const first_name = user.first_name;
  const subject = "Verify Your Borderless Account";
  const optChar1 = otp.charAt(0);
  const optChar2 = otp.charAt(1);
  const optChar3 = otp.charAt(2);
  const optChar4 = otp.charAt(3);
  const email_body = verifyEmailCodeTemp(
    first_name,
    optChar1,
    optChar2,
    optChar3,
    optChar4
  );
  const welcome_body = signedUpTemp(first_name);
  try {
    const results = await Promise.allSettled([
      sendEmail(
        "Welcome to Borderless - Your Journey Begins Here!",
        welcome_body,
        email
      ),
      sendEmail(subject, email_body, email),
    ]);
    const otpResult = results[1];
    if (otpResult.status === "rejected") {
      throw otpResult.reason;
    }
    if (results[0].status === "rejected") {
      console.error(
        "Welcome email failed:",
        results[0].reason?.message || results[0].reason
      );
    }
    return res.status(200).json({
      success: true,
      message: `Successfully signed up. Verification code has been sent to your submitted email - ${email}`,
      userId: user._id,
    });
  } catch (error) {
    console.error("OTP email failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code right now. Please try again in a moment.",
    });
  }
};

const verificationEmailAutoSignup = async (req, res, next) => {
  const { email, first_name, signUpSubject } = req.body;
  const email_body = accountAutoCreatedTemp(first_name);
  try {
    await sendEmail(signUpSubject, email_body, email);
    next();
  } catch (error) {
    return sendError(
      res,
      "Request completed. Unable to send sign up email",
      500
    );
  }
};

const emailVerifiedEmail = async (req, res) => {
  const { user } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  const send_to = email;
  const subject = `Your Email Has Been Verified`;
  const email_body = emailVerifiedTemp(firstName);
  try {
    await sendEmail(subject, email_body, send_to);
  } catch (error) {
    console.error("Email verified notification failed:", error.message || error);
  }
  return res.status(200).json({
    success: true,
    loginStatus: 2,
    message:
      "Your email has been successfully verified, and you are noe logged in",
    user: {
      first_name: user.first_name,
      last_name: user.last_name,
      id: user._id,
      email,
      email_verified: user.email_verified,
    },
  });
};
const resetPasswordEmail = async (req, res) => {
  const { user, token, type } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  let link;
  if (type === "user" || type === "host") {
    link = `${process.env.USER_APP_URL}/update-password?token=${token}&id=${user._id}&type=${type}`;
  } else if (type === "admin") {
    link = `${process.env.ADMIN_APP_URL}/reset-password?token=${token}&id=${user._id}`;
  }

  const send_to = email;
  const subject = `Reset Your Borderless Password`;
  const email_body = resetPasswordTemp(firstName, link);
  try {
    await sendEmail(subject, email_body, send_to);
    return res.status(200).json({
      success: true,
      email,
      userId: user._id,
      message: `Password reset link has been sent to your email - ${email}`,
    });
  } catch (error) {
    console.error("Reset password email failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send password reset email right now. Please try again.",
    });
  }
};
const passwordUpdatedEmail = async (req, res) => {
  const { user } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  const send_to = email;
  const subject = `Your Borderless Password Has Been Updated`;
  const email_body = passwordUpdatedTemp(firstName);
  try {
    await sendEmail(subject, email_body, send_to);
  } catch (error) {
    console.error("Password updated email failed:", error.message || error);
  }
  return res.status(200).json({
    success: true,
    message: "Your password has been successfully updated",
  });
};

// Login
const loginVerificationEmail = async (req, res) => {
  const { user, otp } = req.body;
  const email = user.email;
  const fName = user.first_name;
  const optChar1 = otp.charAt(0);
  const optChar2 = otp.charAt(1);
  const optChar3 = otp.charAt(2);
  const optChar4 = otp.charAt(3);
  const subject = `Your Borderless Login Code`;
  const email_body = verifyLoginCodeTemp(
    fName,
    optChar1,
    optChar2,
    optChar3,
    optChar4
  );
  try {
    await sendEmail(subject, email_body, email);
    return res.status(200).json({
      success: true,
      message: `Login verification code sent to your email - ${email}`,
      adminId: user._id,
    });
  } catch (error) {
    console.error("OTP email failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code right now. Please try again in a moment.",
    });
  }
};
const loginSuccessfulEmail = async (req, res) => {
  const { user, token } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  const subject = `New Login to Your Borderless Account`;
  const email_body = loginVerifiedTemp(firstName);
  try {
    await sendEmail(subject, email_body, email);
  } catch (error) {
    console.error("Login notification email failed:", error.message || error);
  }
  return res.status(200).json({
    success: true,
    loginStatus: 2,
    message: "Successfully logged in",
    user: {
      first_name: firstName,
      last_name: user.last_name,
      email,
      id: user._id,
      email_verified: user.email_verified,
    },
    token,
  });
};

// Website
const contactUsEmail = async (req, res) => {
  const { name, email, company, message } = req.body;
  const subj = req.body.subject;
  const send_to = process.env.CONTACT_EMAIL;
  const subject = `Contact Message from Borderless Travel`;
  const email_body = contactUsEmailTemp(name, email, subj, company, message);
  try {
    await sendEmail(subject, email_body, send_to);
    return sendSuccess(
      res,
      "Your message has been successfully received. We shall revert shortly."
    );
  } catch (error) {
    console.error("Email send failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email right now. Please try again in a moment.",
    });
  }
};

// Bookings
const bookingCreatedEmail = async (req, res) => {
  const {
    first_name,
    email,
    category,
    booking_reference,
    date,
    time,
    subject,
    responseMessage,
    newBooking,
  } = req.body;
  const email_body = bookingSuccessfulTemp(
    first_name,
    booking_reference,
    category,
    date,
    time
  );
  try {
    await sendEmail(subject, email_body, email);
  } catch (error) {
    console.error("Booking created email failed:", error.message || error);
  }
  const { issueBookingAccess } = require("./booking-access");
  const safeBooking = newBooking?.toObject ? newBooking.toObject() : { ...newBooking };
  delete safeBooking.api_key;
  delete safeBooking.firm;
  delete safeBooking.action_by;
  return sendSuccess(res, responseMessage, {
    booking_reference, newBooking: safeBooking,
    ...(category === "Flight" && newBooking ? { booking_access_token: issueBookingAccess(newBooking) } : {}),
  });
};

const apartmentAvailableEmail = async (req, res) => {
  const { email, first_name, apartment_name, location, price, date } = req.body;
  const email_body = apartmentAvailableTemp(
    first_name,
    apartment_name,
    location,
    price,
    date
  );
  const subject = "Your Shortlet Apartment is Ready to Book!";
  try {
    await sendEmail(subject, email_body, email);
    return sendSuccess(
      res,
      "Successfully notified user on the apartment's availability"
    );
  } catch (error) {
    console.error("Email send failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email right now. Please try again in a moment.",
    });
  }
};
const shortletBookingPaymentReceivedEmail = async (req, res, next) => {
  const {
    first_name,
    email,
    apartment_name,
    amountPaid,
    booking_reference,
    check_in_date,
    check_out_date,
  } = req.body;
  const email_body = shortletBookingPaymentRecievedTemp(
    first_name,
    apartment_name,
    amountPaid,
    booking_reference,
    check_in_date,
    check_out_date
  );
  const subject = "Shortlet Apartment Payment Received";
  try {
    await sendEmail(subject, email_body, email);
  } catch (error) {
    console.error("Shortlet payment email failed:", error.message || error);
  }
  return next();
};
const shortletBookingCompletedEmail = async (req, res) => {
  const {
    email,
    first_name,
    apartment_name,
    booking_reference,
    location,
    check_in_date,
    check_out_date,
    booking_id,
  } = req.body;
  const email_body = shortletBookingCompletedTemp(
    first_name,
    apartment_name,
    booking_reference,
    location,
    check_in_date,
    check_out_date
  );
  const subject = "Your Shortlet Booking is Confirmed and Completed!";
  try {
    await sendEmail(subject, email_body, email);
  } catch (error) {
    console.error("Shortlet completed email failed:", error.message || error);
  }
  return sendSuccess(res, "Your payment has been successfully completed", {
    booking_id,
    booking_reference,
  });
};

const flightBookingPaymentReceivedEmail = async (req, res) => {
  const {
    first_name,
    email,
    amountPaid,
    booking_reference,
    date,
    route,
    flight,
    booking_id,
  } = req.body;
  const email_body = flightBookingPaymentRecievedTemp(
    first_name,
    booking_reference,
    amountPaid,
    route,
    flight,
    date
  );
  const subject = "Payment Received for Your Flight Booking";
  const adminSubject = "New Flight Booking Received!";
  const adminEMail = "ticketing@borderless.travel";
  const adminEmailBody = `<html><head></head>><body>
    Hello, we have just received a new flight booking.\n\n
    Route: ${route}\n\n
    Customer First Name: ${first_name}\n\n
    Customer Email: ${email}
    </body>
    </html>
  `;
  try {
    await Promise.all([
      sendEmail(subject, email_body, email),
      sendEmail(adminSubject, adminEmailBody, adminEMail),
    ]);
    return sendSuccess(res, "Your payment has been successfully completed", {
      booking_id,
      booking_reference,
    });
  } catch (error) {
    console.error(error);
    // Payment already succeeded upstream - do not fail the client on mail errors
    return sendSuccess(res, "Your payment has been successfully completed", {
      booking_id,
      booking_reference,
    });
  }
};

const flightTicketIssuedEmail = async (req, res) => {
  const {
    first_name,
    email,
    booking_reference,
    flight,
    destination,
    route,
    date,
    time,
  } = req.body;
  const email_body = flightTicketIssuedTemp(
    first_name,
    booking_reference,
    flight,
    destination,
    route,
    date,
    time
  );
  const subject = "Your Flight Ticket is Issued!";
  try {
    await sendEmail(subject, email_body, email);
    return sendSuccess(
      res,
      "Ticket has been successfully issued",
      booking_reference
    );
  } catch (error) {
    console.error("Email send failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email right now. Please try again in a moment.",
    });
  }
};

const flightTicketCancelledEmail = async (req, res) => {
  const { first_name, email, booking_reference, route, date } = req.body;
  const email_body = flightTicketCancelledTemp(
    first_name,
    booking_reference,
    route,
    date
  );
  const subject = "Update on Your Flight Booking!";
  try {
    await sendEmail(subject, email_body, email);
    return sendSuccess(
      res,
      "Ticket has been successfully cancelled",
      booking_reference
    );
  } catch (error) {
    console.error("Email send failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email right now. Please try again in a moment.",
    });
  }
};

// **
// **
// **

// Profile
const profileUpdatedEmail = async (req, res) => {
  const { user } = req.body;
  const email = user.email;
  const name = user.name;
  const fName = name.split(" ")[0];
  const subject = "Your Profile Has Been Updated - Prodox Exchange";
  const email_body = profileUpdatedTemp(fName);
  try {
    await sendEmail(subject, email_body, email);
    return res.status(200).json({
      success: true,
      message: "Your password has been successfully updated",
    });
  } catch (error) {
    console.error("Email send failed:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email right now. Please try again in a moment.",
    });
  }
};

module.exports = {
  waitlistSubscribedEMail,

  successfulSignupEmail,

  accountVerificationEmail,
  emailVerifiedEmail,
  verificationEmailAutoSignup,

  resetPasswordEmail,
  passwordUpdatedEmail,
  loginVerificationEmail,
  loginSuccessfulEmail,
  contactUsEmail,

  bookingCreatedEmail,
  apartmentAvailableEmail,

  flightBookingPaymentReceivedEmail,
  shortletBookingPaymentReceivedEmail,
  shortletBookingCompletedEmail,

  flightTicketIssuedEmail,
  flightTicketCancelledEmail,

  profileUpdatedEmail,
};
