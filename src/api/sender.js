const axios = require("axios");

exports.sender_tiqwa = async (url, data) => {
  // console.log("data", data);
  try {
    const response = await axios({
      method: "post",
      timeout: 30000,
      maxRedirects: 0,
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
  console.log("data", data);
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

    let resp = response.config.data && JSON.parse(response.config.data);

    // console.log("response", response);
    // console.log("response data", resp && JSON.parse(resp.destinations));
    // console.log(
    //   "response data message",
    //   JSON.parse(response.data.message.destinations),
    // );
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
