const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const waitlistSubscribedTemp = (firstName) => {
  const head = emailHead();
  const footer = emailFooter();

  const body = `
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
                font-size: 26px;
                font-weight: 600;
                padding-top: 15px;
                padding-bottom: 15px;
              "
            >
              <span
                style="
                  display: inline-block;
                  margin-right: 10px;
                  position: relative;
                  top: 6px;
                "
              >
                <img
                  style="width: 35px; height: 35px"
                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/frame.png"
                />
              </span>
              <span><span>Hello ${firstName},</span></span>
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
                  You didn't just join another waitlist.
                  You've entered the world of
                  <strong>Borderless Travels</strong> - your ultimate
                  travel companion, offering affordable
                  flights, curated stays, hassle-free
                  airport transfers, and seamless travel
                  arrangements curated for every kind of
                  explorer.
                </span>
                <span
                  style="
                    display: block;
                    margin-bottom: 25px;
                  "
                >
                  Whether you're a budget backpacker, a
                  luxury seeker, or a business traveler, we
                  bridge the gap between wanderlust and
                  reality.
                </span>
              </p>
            </div>
            <div
              style="
                background-color: #ffe9f7;
                padding: 30px 20px;
              "
            >
              <p
                style="
                  font-size: 24px;
                  text-align: center;
                  font-weight: 600;
                  color: #1c1e23;
                  margin-bottom: 15px;
                "
              >
                We are not here to throw random flight deals
                at you. That's not our vibe.
              </p>
              <p
                style="
                  background-color: #ffffff;
                  text-align: center;
                  max-width: 300px;
                  margin: 0 auto;
                  padding: 15px;
                  font-family: 'Lora', 'IBM Plex Sans',
                    serif;
                  font-style: italic;
                  font-size: 18px;
                "
              >
                What we offer is simple
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Three Grid Images -->
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
    >
      <tr>
        <td
          align="left"
          width="33%"
          style="
            padding-left: 20px;
            padding-right: 10px;
            background-color: #ffffff;
          "
        >
          <div>
            <div>
              <img
                src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/vecteezy_3d.png"
                style="
                  width: 100%;
                  height: 100px;
                  object-fit: contain;
                "
              />
            </div>
            <p
              style="
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                color: #101828d5;
              "
            >
              Seamless bookings
            </p>
          </div>
        </td>
        <td
          align="center"
          width="34%"
          style="background-color: #ffffff; padding: 0 10px"
        >
          <div>
            <div>
              <img
                src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/vecteezy_3dillustrationmuseum.png"
                style="
                  width: 100%;
                  height: 100px;
                  object-fit: contain;
                "
              />
            </div>
            <p
              style="
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                color: #101828d5;
              "
            >
              First-class service
            </p>
          </div>
        </td>
        <td
          align="right"
          width="33%"
          style="
            padding-right: 20px;
            padding-left: 10px;
            background-color: #ffffff;
          "
        >
          <div>
            <div>
              <img
                src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/vecteezy_globallandmarks.png"
                style="
                  width: 100%;
                  height: 100px;
                  object-fit: contain;
                "
              />
            </div>
            <p
              style="
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                color: #101828d5;
              "
            >
              Curated experiences
            </p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Space Divider -->
    <div
      style="padding: 30px 0; background-color: #ffffff"
    ></div>

    <!-- Ordered List -->
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="height: 100px"
    >
      <tr
        style="
          height: 100px;
          border-top: 3px solid #f1f1f1;
          border-bottom: 3px solid #f1f1f1;
          margin-top: 20px;
        "
      >
        <td
          align="left"
          width="20%"
          valign="middle"
          style="
            padding-left: 20px;
            padding-right: 10px;
            background-color: #ffffff;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <div
                  style="
                    padding: 10px;
                    width: 20px; /* Set the width of the circle */
                    height: 20px; /* Set the height of the circle */
                    border: 3px solid black;
                    border-radius: 50%;
                    text-align: center; /* Centers the text horizontally */
                    line-height: 20px; /* Vertically centers the text inside the circle */
                    font-size: 20px; /* You can adjust the font size */
                    font-weight: 600;
                  "
                >
                  1
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="center"
          width="60%"
          valign="middle"
          style="background-color: #ffffff; padding: 0 10px"
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <p
                  style="
                    font-size: 16px;
                    font-weight: 500;
                    color: #660476;
                  "
                >
                  No last-minute confusion
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="right"
          width="20%"
          valign="middle"
          style="
            padding-right: 20px;
            padding-left: 10px;
            background-color: #ffffff;
            height: 100px;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="right"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <img
                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/arrow.png"
                  style="
                    width: 30px;
                    height: 24px;
                    object-fit: contain;
                  "
                />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr
        style="
          height: 100px;
          border-top: 3px solid #f1f1f1;
          border-bottom: 3px solid #f1f1f1;
          margin-top: 20px;
        "
      >
        <td
          align="left"
          width="20%"
          valign="middle"
          style="
            padding-left: 20px;
            padding-right: 10px;
            background-color: #ffffff;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <div
                  style="
                    padding: 10px;
                    width: 20px; /* Set the width of the circle */
                    height: 20px; /* Set the height of the circle */
                    border: 3px solid black;
                    border-radius: 50%;
                    text-align: center; /* Centers the text horizontally */
                    line-height: 20px; /* Vertically centers the text inside the circle */
                    font-size: 20px; /* You can adjust the font size */
                    font-weight: 600;
                  "
                >
                  2
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="center"
          width="60%"
          valign="middle"
          style="background-color: #ffffff; padding: 0 10px"
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <p
                  style="
                    font-size: 16px;
                    font-weight: 500;
                    color: #660476;
                  "
                >
                  No disappearing travel agents
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="right"
          width="20%"
          valign="middle"
          style="
            padding-right: 20px;
            padding-left: 10px;
            background-color: #ffffff;
            height: 100px;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="right"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <img
                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/arrow.png"
                  style="
                    width: 30px;
                    height: 24px;
                    object-fit: contain;
                  "
                />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr
        style="
          height: 100px;
          border-top: 3px solid #f1f1f1;
          border-bottom: 3px solid #f1f1f1;
          margin-top: 20px;
        "
      >
        <td
          align="left"
          width="20%"
          valign="middle"
          style="
            padding-left: 20px;
            padding-right: 10px;
            background-color: #ffffff;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <div
                  style="
                    padding: 10px;
                    width: 20px; /* Set the width of the circle */
                    height: 20px; /* Set the height of the circle */
                    border: 3px solid black;
                    border-radius: 50%;
                    text-align: center; /* Centers the text horizontally */
                    line-height: 20px; /* Vertically centers the text inside the circle */
                    font-size: 20px; /* You can adjust the font size */
                    font-weight: 600;
                  "
                >
                  3
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="center"
          width="60%"
          valign="middle"
          style="background-color: #ffffff; padding: 0 10px"
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="left"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <p
                  style="
                    font-size: 16px;
                    font-weight: 500;
                    color: #660476;
                  "
                >
                  No begging anyone to “please check again.”
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td
          align="right"
          width="20%"
          valign="middle"
          style="
            padding-right: 20px;
            padding-left: 10px;
            background-color: #ffffff;
            height: 100px;
          "
        >
          <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            height="100"
            style="height: 100px; width: 100%"
          >
            <tr>
              <td
                align="right"
                valign="middle"
                style="
                  height: 100px;
                  vertical-align: middle;
                "
              >
                <img
                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/arrow.png"
                  style="
                    width: 30px;
                    height: 24px;
                    object-fit: contain;
                  "
                />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Space Divider -->
    <div
      style="padding: 30px 0; background-color: #ffffff"
    ></div>

    <!-- Image Background Section -->
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
    >
      <tr style="margin-top: 20px">
        <td style="background-color: #ffffff">
          <!-- Image Section (no background color here) -->
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>
              <td style="padding: 0">
                <img
                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/herobgdesktop.png"
                  alt=""
                  width="100%"
                  style="
                    display: block;
                    width: 100%;
                    height: auto;
                  "
                />
              </td>
            </tr>
          </table>

          <!-- Floating Card Section -->
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>
              <td style="padding: 0 20px">
                <div
                  style="
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px 25px;
                    box-shadow: 2px 2px 10px #00000010;
                  "
                >
                  <p
                    style="
                      text-align: center;
                      font-size: 28px;
                      font-weight: 500;
                      margin: 0;
                    "
                  >
                    We take care of every detail
                  </p>
                  <p
                    style="
                      margin: 20px 0;
                      text-align: center;
                    "
                  >
                    - flights, hotels, short-lets, airport
                    transfers, and everything in between.
                  </p>
                  <p
                    style="
                      border: 3px solid #fecdd3;
                      padding: 10px;
                      text-align: center;
                      margin: 0;
                    "
                  >
                    You just show up and enjoy like you
                    deserve to.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Space Divider -->
    <div
      style="padding: 30px 0; background-color: #ffffff"
    ></div>

    <!-- Bottom Email Body -->
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
    >
      <tr style="margin-top: 10px">
        <td
          style="
            padding-left: 20px;
            padding-right: 20px;
            background-color: #ffffff;
          "
        >
          <p
            style="
              text-align: center;
              font-size: 18px;
              margin-bottom: 40px;
            "
          >
            This is travel, the way it should have always
            been and you're one of the few getting early
            <strong>access</strong>.
          </p>
          <p
            style="
              text-align: center;
              font-family: 'Lora', 'IBM Plex Sans',
                sans-serif;
              font-style: italic;
              font-size: 26px;
              margin-bottom: 20px;
            "
          >
            As part of your experience,
          </p>
          <div
            style="
              height: 200px;
              background-color: #f760c0;
              margin-bottom: 20px;
              border-radius: 10px;
            "
          >
            <img
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
              "
              src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/group_1000004257.png"
            />
          </div>
          <p style="font-size: 18px; margin-bottom: 20px">
            We're excited to offer you
            <strong>complimentary guided tours</strong> at
            your final destination,
            <strong>city tours</strong> during long
            layovers, exclusive
            <strong>nightclub access</strong>, and
            <strong>premium</strong> airport lounge
            privileges - all designed to make your journey
            unforgettable.
          </p>
          <p style="font-size: 18px; margin-bottom: 20px">
            Don't mention. There's more.... 😁
          </p>
          <p style="font-size: 18px; margin-bottom: 20px">
            For now, sit back, relax and enjoy the
            borderless experience.
          </p>
          <p style="font-size: 18px">Talk soon,</p>
          <p style="font-size: 18px">Team Borderless</p>
        </td>
      </tr>
    </table>

    <!-- Space Divider -->
    <div
      style="padding: 30px 0; background-color: #ffffff"
    ></div>


  `;

  const template = `${head} ${body} ${footer}`;

  return template;
};

module.exports = {
  waitlistSubscribedTemp,
};
