const { emailFooter } = require("../../includes/footer.template");
const { emailHead } = require("../../includes/head.template");

const passwordUpdatedTemp = (firstName) => {
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
                  >Your Borderless Password Has Been
                  Updated</span
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
                  Great news! Your Borderless account
                  password has been successfully updated.
                  You're all set to log in and continue
                  planning your next adventure.
                </span>
                <span
                  style="
                    display: block;
                    margin-bottom: 25px;
                  "
                >
                  If you didn't make this change, please
                  reach out to our 24/7 support team
                  immediately at
                  <a
                    href="mailto:support@borderless.com"
                    style="
                      color: #660476;
                      text-decoration: none;
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
                  Happy Exploring,<br />Team Borderless
                </span>
              </p>
            </div>
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
                    src="https://res.cloudinary.com/dwimctmdd/image/upload/v1750873294/Frame_1000004176_1_vdrdnv.png"
                    alt="Borderless Travels"
                    title=""
                    style="
                      outline: none;
                      text-decoration: none;
                      -ms-interpolation-mode: bicubic;
                      clear: both;
                      display: inline-block !important;
                      border: none;
                      height: 380px;
                      float: none;
                      width: 100%;
                      object-fit: contain;
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

  `;

  const template = `${head} ${body} ${footer}`;

  return template;
};

module.exports = {
  passwordUpdatedTemp,
};
