const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const shortletBookingPaymentRecievedTemp = (
  first_name,
  apartment_name,
  amountPaid,
  booking_reference,
  check_in_date,
  check_out_date
) => {
  const head = emailHead();
  const footer = emailFooter();

  const body = `
    
  <!-- Header -->
<table
  style="
    font-family: arial, helvetica, sans-serif;
    border-collapse: collapse;
    border-style: hidden; /* hide standard table (collapsed) border */
  "
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  width="100%"
  border="0"
>
  <tbody>
    <tr>
      <td
        class="v-container-padding-padding"
        style="
          overflow-wrap: break-word;
          word-break: break-word;
          padding: 20px;
          padding-bottom: 0;
          font-family: arial, helvetica, sans-serif;
          background-color: #ffffff;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
        "
        align="left"
      >
        <!--[if mso]><table width="100%"><tr><td><![endif]-->
        <h1
          class="v-text-align"
          style="
            margin: 0px;
            line-height: 140%;
            text-align: left;
            word-wrap: break-word;
            font-size: 26px;
            font-weight: 600;
            padding-top: 15px;
            padding-bottom: 15px;
          "
        >
          <span><span>Shortlet Apartment Payment Received!</span></span>
        </h1>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </tbody>
</table>

<!-- Salutation -->
<table
  style="
    font-family: arial, helvetica, sans-serif;
    border-collapse: collapse;
    border-style: hidden; /* hide standard table (collapsed) border */
  "
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  width="100%"
  border="0"
>
  <tbody>
    <tr>
      <td
        class="v-container-padding-padding"
        style="
          overflow-wrap: break-word;
          word-break: break-word;
          padding: 20px;
          padding-bottom: 0;
          font-family: arial, helvetica, sans-serif;
          background-color: #ffffff;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
        "
        align="left"
      >
        <!--[if mso]><table width="100%"><tr><td><![endif]-->
        <h1
          class="v-text-align"
          style="
            margin: 0px;
            line-height: 140%;
            text-align: left;
            word-wrap: break-word;
            font-size: 16px;
            font-weight: 500;
            padding-top: 15px;
            padding-bottom: 15px;
          "
        >
          <img
            src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750757364/vecteezy_online-payment-vector-icon_17513105_1_mv0tji.png"
            alt=""
            style="
              width: 60px;
              height: 60px;
              display: inline-block;
              margin-right: 10px;
            "
          />
          <span style="position: relative; top: -25px"
            ><span>Dear ${first_name},</span></span
          >
        </h1>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </tbody>
</table>

<!-- Upper Email Body -->
<table
  style="font-family: arial, helvetica, sans-serif"
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  width="100%"
  border="0"
>
  <tbody>
    <tr>
      <td
        class="v-container-padding-padding"
        style="
          overflow-wrap: break-word;
          word-break: break-word;
          padding-bottom: 50px;
          font-family: arial, helvetica, sans-serif;
          background-color: #ffffff;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        "
        align="left"
      >
        <div
          class="v-text-align"
          style="
            font-size: 16px;
            line-height: 140%;
            text-align: left;
            padding: 0 20px;
            word-wrap: break-word;
            margin-bottom: 40px;
          "
        >
          <p style="line-height: 140%; font-size: 18px">
            <span style="display: block; margin-bottom: 25px">
              Thank you for your payment for the shortlet apartment booking at
              [Property Name]. We've successfully received your payment of
              <span style="font-weight: 600; color: #660476">${amountPaid}</span>.
            </span>
            <span
              style="
                padding: 20px 10px;
                display: block;
                margin-bottom: 40px;
                background-color: #f5f4f5;
              "
            >
              <span
                style="
                  display: block;
                  border-bottom: 0.6px solid #a7a1a1;
                  padding: 10px 20px;
                  margin-bottom: 10px;
                "
                >Booking Details</span
              >
              <span style="display: block; min-height: 90px">
                <img
                  src=""
                  alt=""
                  style="
                    width: 80px;
                    height: 80px;
                    background-color: #00000030;
                    float: left;
                    border-radius: 10px;
                  "
                />
                <span
                  style="
                    display: block;
                    width: calc(100% - 100px);
                    margin-left: auto;
                    font-size: 14px;
                    margin-bottom: 5px;
                  "
                >
                  <span>Booking ID :</span>
                  <span style="display: block; float: right; font-weight: 600"
                    >${booking_reference}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    width: calc(100% - 100px);
                    margin-left: auto;
                    font-size: 14px;
                    margin-bottom: 5px;
                  "
                >
                  <span>Property :</span>
                  <span
                    style="
                      display: block;
                      float: right;
                      font-weight: 600;
                      color: #660476;
                    "
                    >${apartment_name}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    width: calc(100% - 100px);
                    margin-left: auto;
                    font-size: 14px;
                    margin-bottom: 5px;
                  "
                >
                  <span>Check-In :</span>
                  <span style="display: block; float: right; font-weight: 600"
                    >${check_in_date}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    width: calc(100% - 100px);
                    margin-left: auto;
                    font-size: 14px;
                    margin-bottom: 5px;
                  "
                >
                  <span>Check-Out :</span>
                  <span style="display: block; float: right; font-weight: 600"
                    >${check_out_date}</span
                  >
                </span>
              </span>
            </span>
            <span style="display: block; margin-bottom: 25px">
              Your booking is being processed, and you'll receive a confirmation
              soon. For any questions, contact our 24/7 support at
              <a
                href="mailto:support@borderless.travel"
                style="text-decoration: none; color: #660476"
                >support@borderless.travel</a
              >.
            </span>
            <span style="display: block; margin-bottom: 25px">
              Safe Travels,<br />Team Borderless
            </span>
          </p>
        </div>
      </td>
    </tr>
  </tbody>
</table>


                      
  `;

  const template = `${head} ${body} ${footer}`;

  return template;
};

module.exports = {
  shortletBookingPaymentRecievedTemp,
};
