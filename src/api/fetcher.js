const axios = require("axios");

exports.fetcher_tiqwa = async (url, params = {}) => {
  try {
    const response = await axios({
      method: "get",
      timeout: 15000,
      maxRedirects: 0,
      url: `${process.env.TIQWA_FLIGHT_API}${url}`,
      headers: { Authorization: `Bearer ${process.env.TIQWA_BEARER_TOKEN}` },
      params,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

exports.fetcher_ip_details = async () => {
  try {
    const response = await axios({
      method: "get",
      url: `https://ipapi.co/json`,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

exports.fetcher_paystack = async (url, params = {}) => {
  try {
    const response = await axios({
      method: "get",
      url: `${process.env.PAYSTACK_URL_BASE}${url}`,
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      params,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};
