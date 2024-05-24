const express = require('express');

const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const {
  allPayments,
  paymentDetails,
  pendPayment,
  failPayment,
  completePayment,
} = require('../../controllers/admin/admin-inventory-controller');

const router = express.Router();

router.get('/payments/all-payments', verifyAdminLoginToken, allPayments);
router.get('/payments/payment-details/:id', verifyAdminLoginToken, paymentDetails);
router.put('/payments/pend-payment/:id', verifyAdminLoginToken, pendPayment);
router.put('/payments/fail-payment/:id', verifyAdminLoginToken, failPayment);
router.put('/payments/complete-payment/:id', verifyAdminLoginToken, completePayment);

module.exports = router;
