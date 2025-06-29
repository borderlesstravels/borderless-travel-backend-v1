const { emailFooter } = require("../../includes/footer.template");
const { emailHead } = require("../../includes/head.template");

const loginVerifiedTemp = (firstName) => {
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
                >New Login to Your Borderless
                Account</span
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
            <span><span>Dear ${firstName},</span></span>
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
                We noticed a new login to your Borderless
                account.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 10px;
                "
              >
                <strong>Location:</strong> Houston, Texas
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 10px;
                "
              >
                <strong>Device:</strong> Pixel 6 Pro
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 10px;
                "
              >
                <strong>Time:</strong> 4:25:07PM
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                <strong>Date:</strong> Monday, Nov 07,2022
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                If this was you, no action is
                needed—you're ready to explore the world
                with us!
              </span>

              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                  background-color: #fbf5ff;
                  padding: 20px;
                  font-size: 12px;
                "
              >
                If you don't recognize this login, please
                contact our 24/7 support team at
                <a
                  href="mailto:support@borderless.com"
                  style="color: #670677"
                  >support@borderless.com</a
                >
                or reset your password at
                <a
                  href="https://borderless.travel/reset-password"
                  target="_blank"
                  style="color: #670677"
                  >borderless.travel/reset-password</a
                >.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Safe travels,<br />Team Borderless
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
  loginVerifiedTemp,
};
