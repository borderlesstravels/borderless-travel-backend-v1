const Payment = require('../../models/general/Payment');
const { sendError, sendSuccess } = require('../../utils/helpers');

// Payments
const allPayments = async (req, res) => {
  try {
    const payments = await Payment.find().limit(req.query.limit);
    if (payments.length < 1) {
      return sendSuccess(res, 'No payment data available yet');
    }
    return sendSuccess(res, 'Successfuly fetched payments data', payments);
  } catch (error) {
    return sendError(res, `Could not fetch payments data. Error - ${error}`);
  }
};

const paymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendSuccess(res, 'Payment data does not exist');
    }
    return sendSuccess(res, 'Successfuly fetched payments data', payment);
  } catch (error) {
    return sendError(res, `Could not fetch payments data. Error - ${error}`);
  }
};

const pendPayment = async (req, res) => {
  const adminId = req.id;
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendSuccess(res, 'Payment data does not exist');
    }
    if (payment.status === 'pending') {
      return sendSuccess(res, 'Payment is already PENDING');
    }
    payment.status = 'pending';
    payment.action_by = adminId;
    await payment.save();
    return sendSuccess(res, 'Payment status has been updated to PENDING', payment);
  } catch (error) {
    return sendError(res, `Could not fetch payments data. Error - ${error}`);
  }
};
const failPayment = async (req, res) => {
  const adminId = req.id;
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendSuccess(res, 'Payment data does not exist');
    }
    if (payment.status === 'failed') {
      return sendSuccess(res, 'Payment already has a status of FAILED');
    }
    payment.status = 'failed';
    payment.action_by = adminId;
    await payment.save();
    return sendSuccess(res, 'Payment status has been updated to FAILED', payment);
  } catch (error) {
    return sendError(res, `Could not fetch payments data. Error - ${error}`);
  }
};
const completePayment = async (req, res) => {
  const adminId = req.id;
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendSuccess(res, 'Payment data does not exist');
    }
    if (payment.status === 'completed') {
      return sendSuccess(res, 'Payment already has a status of COMPLETED');
    }
    payment.status = 'completed';
    payment.action_by = adminId;
    await payment.save();
    return sendSuccess(res, 'Payment status has been updated to COMPLETED', payment);
  } catch (error) {
    return sendError(res, `Could not fetch payments data. Error - ${error}`);
  }
};

module.exports = { allPayments, paymentDetails, pendPayment, failPayment, completePayment };
