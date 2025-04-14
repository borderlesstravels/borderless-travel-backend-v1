const emailFooter = () => {
  const footer = `


<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-image:url(https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/emailbanner1.png); background-repeat:no-repeat; background-size:cover; background-position:center center; width: 700px;">
	<tbody>
		<tr>
			<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; font-weight: 400; padding-bottom: 10px; padding-right: 50px; padding-top: 10px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
				<table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
					<tr>
						<td class="pad" colspan="2">
							<div style="text-align:left;">
							<img src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/borderless2_0Ux.png" height="70px" alt="${process.env.APP_NAME}" />
							</div>
						</td>
						<td class="pad" colspan="2"></td>
						<td class="pad"></td>
						<td class="pad"></td>
						<td class="pad"></td>
						<td class="pad" colspan="2">
							<div style="padding-left:40%; color:#ffffff;direction:ltr;font-family:Inter, sans-serif;font-size:13px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:right;mso-line-height-alt:15.6px;">
								<p style="text-align-right"><em>If you didn't register on ${process.env.APP_NAME} with this email, kindly ignore this email.</em></p>
								<div style="height:10px; width:70%; background:white;"></div>
								<p style="text-align-right"><em>Copyright © 2025 ${process.env.APP_NAME}. All rights reserved.</em></p>
								<div style="display:flex; text-align:right; padding-left:100%">
									<a href="https://facebook.com/hqborderless" style="margin-right:30px">
										<img src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/facebook.png" height="20px" alt="${process.env.APP_NAME}" />
									</a>
									<a href="https://www.instagram.com/borderless_hq" style="margin-right:30px">
										<img src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/instagram.png" height="20px" alt="${process.env.APP_NAME}" />
									</a>
									<a href="https://x.com/borderless_HQ">
										<img src="https://demo.stripocdn.email/content/guids/dca23089-f417-4ff2-af78-eb488068b965/images/x.png" height="20px" alt="${process.env.APP_NAME}" />
									</a>
								</div>
							</div>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</tbody>
</table>

</td>
</tr>
</tbody>
</table><!-- End -->
</body>

</html>
`;
  return footer;
};

module.exports = {
  emailFooter,
};
