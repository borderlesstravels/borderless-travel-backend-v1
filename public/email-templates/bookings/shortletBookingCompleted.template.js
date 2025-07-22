const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const shortletBookingCompletedTemp = (
  first_name,
  apartment_name,
  booking_reference,
  location,
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
          <span
            ><span
              >Your Shortlet Booking is Confirmed!</span
            ></span
          >
        </h1>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </tbody>
</table>

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
                src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750757332/Group_1000004284_1_bw3ogk.png"
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
              We're excited to confirm your shortlet
              apartment booking with Borderless! Get
              ready for a comfortable stay at ${apartment_name}.
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
              <span
                style="display: block; min-height: 90px"
              >
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
                  <span
                    style="
                      display: block;
                      float: right;
                      font-weight: 600;
                    "
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
                  <span>Location :</span>
                  <span
                    style="
                      display: block;
                      float: right;
                      font-weight: 600;
                    "
                    >${location}</span
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
                  <span
                    style="
                      display: block;
                      float: right;
                      font-weight: 600;
                    "
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
                  <span
                    style="
                      display: block;
                      float: right;
                      font-weight: 600;
                    "
                    >${check_out_date}</span
                  >
                </span>
              </span>
            </span>
            <span
              style="
                display: block;
                margin-bottom: 25px;
              "
            >
              You can view your booking details at
              <a
                href="borderless.com/my-bookings"
                style="
                  color: #660476;
                  text-decoration: none;
                "
                >borderless.com/my-bookings</a
              >. Need help? Reach out to our 24/7
              support at
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
              Questions? Contact our 24/7 support at
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
              Happy Travels,<br />Team Borderless
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
  shortletBookingCompletedTemp,
};
