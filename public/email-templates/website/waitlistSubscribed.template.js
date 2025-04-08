const { emailFooter } = require("../includes/footer.template");
const { emailHead } = require("../includes/head.template");

const waitlistSubscribedTemp = (firstName) => {
  const head = emailHead();
  const footer = emailFooter();

  const body = `


  <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;">
						<tbody>
							<tr>
								<td>
<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000; background-color: #eef4f3; background-size: auto; border: 0 solid #efeef4; width: 700px; margin: 0 auto;" width="700">
<tbody>
	<tr>
		<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; font-weight: 400; background-color: #ffffff; padding-bottom: 20px; padding-left: 25px; padding-right: 25px; padding-top: 20px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
			<table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
				<tr>
					<td class="pad" style="padding-bottom:20px;padding-top:10px;text-align:center;width:100%;">
						<h2 style="margin: 0; color: #660476; direction: ltr; font-family: Inter, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0;"><span class="tinyMce-placeholder">Hello ${firstName},&nbsp;</span></h2>
					</td>
				</tr>
			</table>
			<table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
				<tr>
					<td class="pad">
						<div style="color:#201f42;direction:ltr;font-family:Inter, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
							<p style="margin: 0; margin-bottom: 0px;">You didn’t just join another waitlist — you've entered the world of Borderless Travels.</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0; margin-bottom: 0px;">We’re not here to throw random flight deals at you. That’s not our vibe.</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">What we offer is simple:</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<div style="margin-left:20px">
								<div>✔ Seamless bookings.</div>
								<div>✔ First-class service.</div>
								<div>✔ Trips so smooth, you’ll forget what stress even feels like.</div>
							</div>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<div>
								<div>No last-minute confusion.</div>
								<div>No disappearing travel agents.</div>
								<div>No begging anyone to “please check again.”</div>
							</div>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">We take care of every detail — flights, hotels, short-lets, airport transfers, and everything in between. You just show up and enjoy like you deserve to.
							</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">This is travel, the way it should have always been and you’re one of the few getting early access.
							</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">As part of your experience, We’re excited to offer you complimentary guided tours at your destination, city tours during long layovers, exclusive nightclub access, and premium airport lounge privileges — all designed to make your journey unforgettable.
							</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">Don't mention. There's more.... 😁
							</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">For now, sit back, relax and enjoy the borderless experience.
							</p>
							<p style="margin: 0; margin-bottom: 0px;">&nbsp;</p>
							<p style="margin: 0;">Talk soon, <br>
							Team Borderless
							</p>
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
</table>


  `;

  const template = `${head} ${body} ${footer}`;

  return template;
};

module.exports = {
  waitlistSubscribedTemp,
};
