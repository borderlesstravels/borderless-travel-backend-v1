const axios = require("axios");
const { PaymentError } = require("./payment-integrity");

function options() {
  if (!process.env.PAYSTACK_SECRET) throw new PaymentError("Transfer service unavailable", 503);
  return { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` }, timeout: 15000, maxRedirects: 0 };
}
async function call(method, route, body) {
  try {
    const response = method === "GET"
      ? await axios.get(`https://api.paystack.co${route}`, options())
      : await axios.post(`https://api.paystack.co${route}`, body, options());
    if (response.status < 200 || response.status >= 300 || response.data?.status !== true || !response.data.data) {
      throw new Error("Unconfirmed provider response");
    }
    return response.data.data;
  } catch {
    // No automatic retries of money-moving POST requests or upstream dumps.
    throw new PaymentError("Transfer outcome requires reconciliation. Do not create a replacement withdrawal.", 502);
  }
}
module.exports = {
  assertConfigured: options,
  createRecipient: body => call("POST", "/transferrecipient", body),
  initiateTransfer: body => call("POST", "/transfer", body),
  verifyTransfer: reference => call("GET", `/transfer/verify/${encodeURIComponent(reference)}`),
};
