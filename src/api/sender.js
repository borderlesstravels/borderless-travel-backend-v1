const axios = require("axios");

exports.sender_tiqwa = async (url, data) => {
  try {
    const response = await axios({
      method: "post",
      url: `${process.env.TIQWA_FLIGHT_API}${url}`,
      headers: { Authorization: `Bearer ${process.env.TIQWA_BEARER_TOKEN}` },
      data,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

exports.sender_tiqwa_json = async (url, data) => {
  try {
    const response = await axios({
      method: "post",
      url: `https://prod.tiqwa.com/v1/flight/multi_city/search`,
      headers: {
        // "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TIQWA_BEARER_TOKEN}`,
      },
      data,
    });

    console.log("response 111", JSON.parse(response?.config?.data));
    return response;
  } catch (error) {
    return error.response;
  }
};

exports.sender_paystack = async (url, data) => {
  try {
    const response = await axios({
      method: "post",
      url: `${process.env.PAYSTACK_URL_BASE}${url}`,
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      data,
    });
    return response.data;
  } catch (error) {
    return error.response;
  }
};
