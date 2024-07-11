require('dotenv').config();
const sendEmail = require('../utils/email/sendEmail.util');
const {
  emailVerifiedTemp,
} = require('../../public/email-templates/auth/signup/emailVerified.template');
const {
  passwordUpdatedTemp,
} = require('../../public/email-templates/auth/password/passwordUpdated.template');
const {
  resetPasswordTemp,
} = require('../../public/email-templates/auth/password/resetPassword.template');
const {
  verifyEmailCodeTemp,
} = require('../../public/email-templates/auth/signup/verifyEmailCode.template');
const {
  verifyLoginCodeTemp,
} = require('../../public/email-templates/auth/login/verifyLoginCode.template');
const {
  loginVerifiedTemp,
} = require('../../public/email-templates/auth/login/loginVerified.template');
const {
  profileUpdatedTemp,
} = require('../../public/email-templates/profile/profileUpdated.template');
const { formatCurrency } = require('../utils/helpers');
const {
  refEarningWidthrawnTemp,
} = require('../../public/email-templates/transactions/refEarningWidthrawnTemp');
const {
  verifyTransferCodeTemp,
} = require('../../public/email-templates/transactions/verifyTransferCode.template');
const {
  transferSuccessfulSenderTemp,
} = require('../../public/email-templates/transactions/transferSuccessfulSender.template');
const {
  transferSuccessfulReceiverTemp,
} = require('../../public/email-templates/transactions/transferSuccessfulReceiver.template');
const {
  verifyCashWithdrawalCodeTemp,
} = require('../../public/email-templates/transactions/withdraws/verifyCashWithdrawalCode.template');
const {
  cashWithdrawalSuccessfulTemp,
} = require('../../public/email-templates/transactions/withdraws/cashWithdrawalSuccessful.template');
const {
  cashDepositCreatedTemp,
} = require('../../public/email-templates/transactions/deposits/cashDepositCreated.template');
const { contactUsEmailTemp } = require('../../public/email-templates/website/contactUsEmailTemp');

// General
const verificationEmail = async (req, res) => {
  const { user, otp } = req.body;
  const email = user.email;
  const first_name = user.first_name;

  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `Verify Your Email - ${process.env.APP_NAME}`;

    const email_body = verifyEmailCodeTemp(first_name, otp);

    sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      message: `Successfully signed up. Verification code has been sent to your submitted email - ${email}`,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
const emailVerifiedEmail = async (req, res) => {
  const { user } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `Your Email Has Been Verified - ${process.env.APP_NAME}`;

    const email_body = emailVerifiedTemp(firstName);

    sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      loginStatus: 2,
      message: 'Your email has been successfully verified, and you are noe logged in',
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        id: user._id,
        email,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
const resetPasswordEmail = async (req, res) => {
  const { user, token } = req.body;
  const email = user.email;
  const firstName = user.first_name;

  const link = `${process.env.USER_APP_URL}/reset-password?token=${token}&id=${user._id}`;

  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `Reset Your Password - ${process.env.APP_NAME}`;

    const email_body = resetPasswordTemp(firstName, link);

    await sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      email,
      userId: user._id,
      message: `Password reset link has been sent to your email - ${email}`,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
const passwordUpdatedEmail = async (req, res) => {
  const { user } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `Your Password Has Been Updated - ${process.env.APP_NAME}`;

    const email_body = passwordUpdatedTemp(firstName);

    await sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully updated',
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Login
const loginVerificationEmail = async (req, res) => {
  const { user, otp } = req.body;
  const email = user.email;
  const fName = user.first_name;

  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `Please Verify That It's You - ${process.env.APP_NAME}`;

    const email_body = verifyLoginCodeTemp(fName, otp);
    try {
      console.log('OTP about to be sent');
      await sendEmail(subject, email_body, send_to, send_from, reply_to);
    } catch (error) {
      res.status(500).json(error.message);
    }
    return res.status(200).json({
      success: true,
      message: `Login verification code sent to your email - ${email}`,
      adminId: user._id,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
const loginSuccessfulEmail = async (req, res) => {
  const { user, token } = req.body;
  const email = user.email;
  const firstName = user.first_name;
  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = `You Have Successfully Logged - ${process.env.APP_NAME}`;

    const email_body = loginVerifiedTemp(firstName);

    try {
      await sendEmail(subject, email_body, send_to, send_from, reply_to);
    } catch (error) {
      res.status(500).json(error.message);
    }
    console.log('User details: ', user);
    return res.status(200).json({
      success: true,
      loginStatus: 2,
      message: 'Successfully logged in',
      user: {
        first_name: firstName,
        last_name: user.last_name,
        email,
        id: user._id,
        email_verified: user.email_verified,
      },
      token,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Website
const contactUsEmail = async (req, res) => {
  const { name, email, company, message } = req.body;
  const subj = req.body.subject;
  try {
    const send_to = process.env.CONTACT_EMAIL;
    const reply_to = email;
    const send_from = email;
    const subject = `Contact Message from Borderless Travel`;

    const email_body = contactUsEmailTemp(name, email, subj, company, message);

    try {
      await sendEmail(subject, email_body, send_to, send_from, reply_to);
    } catch (error) {
      res.status(500).json(error.message);
    }
    return res.status(200).json({
      success: true,
      message: 'Your message has been successfully received. We shall revert shortly.',
    });
  } catch (error) {
    res.status(500).json(error.message);
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
  const fName = name.split(' ')[0];
  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = 'Your Profile Has Been Updated - Prodox Exchange';

    const email_body = profileUpdatedTemp(fName);

    await sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully updated',
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Withdraw Earning
const refEarningWithdrawnEmail = async (req, res) => {
  const { user, amount } = req.body;
  const email = user.email;
  const name = user.name;
  const fName = name.split(' ')[0];
  const formattedAmount = formatCurrency(amount);
  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = 'Successfully Withdrawn Referral Earning - Prodox Exchange';

    const email_body = refEarningWidthrawnTemp(fName, formattedAmount);

    sendEmail(subject, email_body, send_to, send_from, reply_to);
    return res.status(200).json({
      success: true,
      message: 'Your referral earning has been successfully withdrawn',
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Transaction
const transferVerificationEmail = async (req, res) => {
  const { user, otp, username, amount, ticker, narration, receiverId } = req.body;
  const email = user.email;
  const name = user.name;
  const fName = name.split(' ')[0];

  try {
    const send_to = email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = 'Verify Asset Transfer - Prodox Exchange';

    const email_body = verifyTransferCodeTemp(fName, otp, amount, ticker, username);

    await sendEmail(subject, email_body, send_to, send_from, reply_to);
    console.log('Transaction OTP sent');

    return res.status(200).json({
      success: true,
      message: 'Transaction verification code has been sent to your account email',
      vals: { username, amount, ticker, narration, receiverId },
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
const transferSuccessfulEmail = async (req, res) => {
  const { user, amount, ticker, username, receiver, t_id } = req.body;
  const email = user.email;
  const r_email = receiver.email;
  const name = user.name;
  const sender = user.username;
  const r_name = receiver.name;
  const fName = name.split(' ')[0];
  const r_fName = r_name.split(' ')[0];
  try {
    const send_to = email;
    const r_send_to = r_email;
    const reply_to = process.env.APP_EMAIL;
    const send_from = process.env.APP_EMAIL;
    const subject = 'Asset Transfer Successful - Prodox Exchange';
    const r_subject = 'You Have Received Asset Transfer - Prodox Exchange';

    const email_body = transferSuccessfulSenderTemp(fName, amount, ticker, username);
    const r_email_body = transferSuccessfulReceiverTemp(r_fName, amount, ticker, sender, t_id);

    try {
      await sendEmail(subject, email_body, send_to, send_from, reply_to);
      await sendEmail(r_subject, r_email_body, r_send_to, send_from, reply_to);
    } catch (error) {
      res.status(500).json(error.message);
    }
    return res.status(200).json({
      success: true,
      message: `Successfully transferred ${amount} ${ticker} to ${username}`,
      data: {
        amount,
        asset: ticker,
        receiver: username,
        t_id,
      },
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  verificationEmail,
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginVerificationEmail,
  loginSuccessfulEmail,

  contactUsEmail,

  profileUpdatedEmail,
  refEarningWithdrawnEmail,
  transferVerificationEmail,
  transferSuccessfulEmail,
};
