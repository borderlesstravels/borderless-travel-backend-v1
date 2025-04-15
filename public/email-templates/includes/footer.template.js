const emailFooter = () => {
  const footer = `

                        <!-- Footer -->
                        <div style="padding: 20px; background-color: #660476">
                          <!-- Put the image absolute here -->
                          <table
                            role="presentation"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                          >
                            <tr
                              style="
                                background-image: url(https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/emailbanner1.png);
                                background-position: left;
                              "
                            >
                              <td
                                align="left"
                                width="30%"
                                style="margin-bottom: 10px"
                              >
                                <img
                                  src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/borderless2_0Ux.png"
                                  alt="Logo"
                                  style="width: 50px; height: 50px"
                                />
                              </td>
                              <td
                                align="right"
                                width="70%"
                                style="margin-bottom: 10px"
                              >
                                <div
                                  style="margin-left: auto; max-width: 250px"
                                >
                                  <p
                                    style="
                                      color: #ffffff;
                                      font-size: 14px;
                                      text-align: right;
                                      margin-bottom: 10px;
                                    "
                                  >
                                    If you didn't register with Borderless
                                    Travels with this email, kindly ignore this
                                    email.
                                  </p>
                                  <p
                                    style="
                                      font-style: italic;
                                      color: #ffffff;
                                      font-size: 10px;
                                      text-align: right;
                                      margin-bottom: 10px;
                                    "
                                  >
                                    Copyright &copy; 2025 Borderless Travels.
                                    All rights reserved.
                                  </p>
                                  <div
                                    style="
                                      margin-left: auto;
                                      max-width: 200px;
                                      text-align: right;
                                    "
                                  >
                                    <a
                                      target="_blank"
                                      href="https://facebook.com/hqborderless"
                                      style="
                                        display: inline-block;
                                        margin: 0 10px;
                                        text-decoration: none;
                                      "
                                    >
                                      <img
                                        src=" https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/facebook.png"
                                        alt="Facebook"
                                        style="width: 30px; height: 30px"
                                      />
                                    </a>
                                    <a
                                      target="_blank"
                                      href="https://instagram.com/borderless_hq"
                                      style="
                                        display: inline-block;
                                        margin: 0 10px;
                                        text-decoration: none;
                                      "
                                    >
                                      <img
                                        src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/instagram.png"
                                        alt="Instagram"
                                        style="width: 30px; height: 30px"
                                      />
                                    </a>
                                    <a
                                      target="_blank"
                                      href="https://x.com/borderless_hq"
                                      style="
                                        display: inline-block;
                                        margin: 0 10px;
                                        text-decoration: none;
                                      "
                                    >
                                      <img
                                        src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/x.png"
                                        alt="Twitter"
                                        style="width: 30px; height: 30px"
                                      />
                                    </a>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>

            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
    <!--[if mso]></div><![endif]-->
    <!--[if IE]></div><![endif]-->
  </body>
</html>


`;
  return footer;
};

module.exports = {
  emailFooter,
};
