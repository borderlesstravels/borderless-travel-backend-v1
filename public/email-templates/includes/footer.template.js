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
                            <tr>
                              <td style="margin-bottom: 10px">
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
                                        width: 32px;
                                        height: 32px;
                                        background-color: #f5f6f6;
                                        position: relative;
                                        border-radius: 50%;
                                      "
                                    >
                                      <img
                                        src=""
                                        alt="Facebook"
                                        style="
                                          position: absolute;
                                          width: 18px;
                                          height: 18px;
                                          top: 50%;
                                          left: 50%;
                                          transform: translate(-50%, -50%);
                                        "
                                      />
                                    </a>
                                    <a
                                      target="_blank"
                                      href="https://instagram.com/borderless_hq"
                                      style="
                                        display: inline-block;
                                        margin: 0 10px;
                                        text-decoration: none;
                                        width: 32px;
                                        height: 32px;
                                        background-color: #f5f6f6;
                                        position: relative;
                                        border-radius: 50%;
                                      "
                                    >
                                      <img
                                        src=""
                                        alt="Instagram"
                                        style="
                                          position: absolute;
                                          width: 18px;
                                          height: 18px;
                                          top: 50%;
                                          left: 50%;
                                          transform: translate(-50%, -50%);
                                        "
                                      />
                                    </a>
                                    <a
                                      target="_blank"
                                      href="https://x.com/borderless_hq"
                                      style="
                                        display: inline-block;
                                        margin: 0 10px;
                                        text-decoration: none;
                                        width: 32px;
                                        height: 32px;
                                        background-color: #f5f6f6;
                                        position: relative;
                                        border-radius: 50%;
                                      "
                                    >
                                      <img
                                        src=""
                                        alt="Twitter"
                                        style="
                                          position: absolute;
                                          width: 18px;
                                          height: 18px;
                                          top: 50%;
                                          left: 50%;
                                          transform: translate(-50%, -50%);
                                        "
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
