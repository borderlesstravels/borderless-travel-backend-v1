const { emailFooter } = require("../../includes/footer.template");
const { emailHead } = require("../../includes/head.template");

const verifyLoginCodeTemp = (fName, optChar1, optChar2, optChar3, optChar4) => {
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
                >Your Borderless Login Code</span
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
            <span><span>Dear ${fName},</span></span>
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
                To securely log in to your Borderless
                account, please use the following One-Time
                Password (OTP):
              </span>
              <span style="display: block">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="padding: 0 70px"
                >
                  <tr>
                    <td align="center" style="width: 25%">
                      <span
                        style="
                          display: inline-block;
                          margin: 0 auto;
                          width: 60px;
                          height: 60px;
                          line-height: 60px;
                          font-size: 30px;
                          background-color: #892cdc0d;
                          text-align: center;
                        "
                      >
                        ${optChar1}
                      </span>
                    </td>
                    <td align="center" style="width: 25%">
                      <span
                        style="
                          display: inline-block;
                          margin: 0 auto;
                          width: 60px;
                          height: 60px;
                          line-height: 60px;
                          font-size: 30px;
                          background-color: #892cdc0d;
                          text-align: center;
                        "
                      >
                        ${optChar2}
                      </span>
                    </td>
                    <td align="center" style="width: 25%">
                      <span
                        style="
                          display: inline-block;
                          margin: 0 auto;
                          width: 60px;
                          height: 60px;
                          line-height: 60px;
                          font-size: 30px;
                          background-color: #892cdc0d;
                          text-align: center;
                        "
                      >
                        ${optChar3}
                      </span>
                    </td>
                    <td align="center" style="width: 25%">
                      <span
                        style="
                          display: inline-block;
                          margin: 0 auto;
                          width: 60px;
                          height: 60px;
                          line-height: 60px;
                          font-size: 30px;
                          background-color: #892cdc0d;
                          text-align: center;
                        "
                      >
                        ${optChar4}
                      </span>
                    </td>
                  </tr>
                </table>
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                This code is valid for 10 minutes.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                If you didn't request this, feel free to
                ignore this email or contact our 24/7
                support at
                <a
                  style="color: #670677"
                  href="mailto:support@borderless.travel"
                  >support@borderless.travel</a
                >.
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                We're excited to help you plan your next
                journey!
              </span>
              <span
                style="
                  display: block;
                  margin-bottom: 25px;
                "
              >
                Best,<br />Team Borderless
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
  verifyLoginCodeTemp,
};
