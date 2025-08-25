const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const flightTicketCancelledTemp = (
  first_name,
  booking_reference,
  route,
  date
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
                  src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750757439/vecteezy_airport-terminal-and-plane-in-winter_13389492_1_1_ehqryl.png"
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
                <span
                  style="
                    padding: 0 20px;
                    display: block;
                    position: relative;
                    top: -20px;
                  "
                >
                  <span
                    style="
                      background-color: white;
                      padding: 20px 20px;
                      display: block;
                      text-align: left;
                    "
                  >
                    <span
                      style="
                        font-size: 22px;
                        font-weight: 600;
                        display: block;
                        width: 80%;
                        text-align: left;
                      "
                      >Update on Your Flight Booking</span
                    >
                    <img
                      src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750757476/vecteezy_payment-failed-vector-icon-design-illustration_22156405-1_1_ipqrwa.png"
                      alt=""
                      style="
                        width: 35px;
                        height: 35px;
                        float: right;
                        position: relative;
                        top: -35px;
                      "
                    />
                  </span>
                </span>
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
                We're sorry to inform you that your flight
                booking (${booking_reference}) for ${route} on
                ${date} could not be processed as it was cancelled.
              </span>
              
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Let's find another option! Explore
                alternative flights at
                <a
                  href="https://borderless.travel/flights"
                  style="
                    text-decoration: none;
                    color: #660476;
                  "
                  >borderless.travel/flights</a
                >
                or contact our 24/7 support at
                <a
                  href="mailto:support@borderless.travel"
                  style="
                    text-decoration: none;
                    color: #660476;
                  "
                  >support@borderless.travel</a
                >
                for assistance.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                We're here to make your travel dreams
                happen.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Team Borderless
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
  flightTicketCancelledTemp,
};
