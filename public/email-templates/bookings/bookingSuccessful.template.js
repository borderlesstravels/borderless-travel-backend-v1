const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const bookingSuccessfulTemp = (
  first_name,
  booking_reference,
  category,
  date,
  time
) => {
  const head = emailHead();
  const footer = emailFooter();

  const body = `
    
  <!-- Image Section  -->
  <table
    id="u_content_image_1"
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
          "
          align="left"
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>
              <td
                class="v-text-align"
                style="
                  padding-right: 0px;
                  padding-left: 0px;
                "
                align="center"
              >
                <img
                  align="center"
                  border="0"
                  src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750757292/BannerSubstrate1Columns_1_suvkep.png"
                  alt="Borderless Travels"
                  title=""
                  style="
                    outline: none;
                    text-decoration: none;
                    -ms-interpolation-mode: bicubic;
                    clear: both;
                    display: inline-block !important;
                    border: none;
                    height: 180px;
                    float: none;
                    width: 100%;
                    object-fit: cover;
                    background-color: #660476;
                    margin-top: 40px;
                  "
                  width="480"
                />
              </td>
            </tr>
          </table>
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
            <span><span>Dear ${first_name},</span></span>
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
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Congratulations! Your ${category} booking with Borderless
                is confirmed. Here are the details:
              </span>
              <span
                style="
                  display: block;
                  border: 1px dashed #00000050;
                  margin-bottom: 20px;
                  font-size: 14px;
                "
              >
                <span
                  style="
                    text-align: center;
                    display: block;
                    color: #670677;
                    font-weight: 700;
                    padding: 10px 0;
                    font-size: 16px;
                  "
                  >Here's a recap of your Booking</span
                >
                <span
                  style="
                    display: block;
                    padding: 10px 20px;
                    border-top: 0.6px dashed #00000060;
                    border-bottom: 0.6px dashed #00000060;
                  "
                >
                  <span style="width: 50%"
                    >Category :</span
                  >
                  <span
                    style="
                      width: 50%;
                      float: right;
                      text-align: right;
                      color: #676767;
                    "
                    >${category}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    padding: 10px 20px;
                    border-top: 0.6px dashed #00000060;
                    border-bottom: 0.6px dashed #00000060;
                  "
                >
                  <span style="width: 50%"
                    >Booking ID :</span
                  >
                  <span
                    style="
                      width: 50%;
                      float: right;
                      text-align: right;
                      color: #676767;
                    "
                    >${booking_reference}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    padding: 10px 20px;
                    border-top: 0.6px dashed #00000060;
                    border-bottom: 0.6px dashed #00000060;
                  "
                >
                  <span style="width: 50%">Time :</span>
                  <span
                    style="
                      width: 50%;
                      float: right;
                      text-align: right;
                      color: #676767;
                    "
                    >${time}</span
                  >
                </span>
                <span
                  style="
                    display: block;
                    padding: 10px 20px;
                    border-top: 0.6px dashed #00000060;
                    border-bottom: 0.6px dashed #00000060;
                  "
                >
                  <span style="width: 50%">Date :</span>
                  <span
                    style="
                      width: 50%;
                      float: right;
                      text-align: right;
                      color: #676767;
                    "
                    >${date}</span
                  >
                </span>
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                You can view or manage your booking
                anytime at
                <a
                  href="borderless.com/my-bookings"
                  style="
                    text-decoration: none;
                    color: #660476;
                  "
                  >borderless.com/my-bookings</a
                >. Need assistance? Our 24/7 support team
                is here at
                <a
                  href="mailto:support@borderless.com"
                  style="
                    text-decoration: none;
                    color: #660476;
                  "
                  >support@borderless.com</a
                >.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Here's to creating unforgettable memories!
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Cheers,<br />Team Borderless
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
  bookingSuccessfulTemp,
};
