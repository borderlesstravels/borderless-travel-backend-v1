const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const apartmentAvailableTemp = (
  first_name,
  apartment_name,
  location,
  price,
  date
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
                >Your Shortlet Apartment is Ready to
                Book!</span
              ></span
            >
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
                Great news! The shortlet apartment you're
                interested in, ${apartment_name}, is now
                available for your requested dates
                (${date}).
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
                  >Property Details</span
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
                    <span>Price :</span>
                    <span
                      style="
                        display: block;
                        float: right;
                        font-weight: 600;
                        color: #660476;
                      "
                      >${price}</span
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
                    <span>Availability :</span>
                    <span
                      style="
                        display: block;
                        float: right;
                        font-weight: 600;
                      "
                      >${date}</span
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
                Secure your stay now by completing your
                booking at
                <a
                  href="https://borderless.travel/shortlet-booking"
                  style="
                    color: #660476;
                    text-decoration: none;
                  "
                  >borderless.travel/shortlet-booking</a
                >. This listing is in high demand, so
                don't wait!
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Questions? Contact our 24/7 support at
                <a
                  href="mailto:support@borderless.travel"
                  style="
                    text-decoration: none;
                    color: #660476;
                  "
                  >support@borderless.travel</a
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
  apartmentAvailableTemp,
};
