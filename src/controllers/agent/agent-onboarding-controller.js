const AgentApplication = require("../../models/agent/AgentApplication");
const {
  sendError,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");

const normalizeApplicationPayload = (body) => ({
  full_name: (body.full_name || body.fullName || "").trim(),
  email: (body.email || "").trim().toLowerCase(),
  phone: (body.phone || "").trim(),
  location: (body.location || "").trim(),
  education: body.education,
});

const submitAgentApplication = async (req, res) => {
  const payload = normalizeApplicationPayload(req.body);

  try {
    const existingApplication = await AgentApplication.findOne({
      email: payload.email,
    });
    if (existingApplication) {
      return badRequestError(
        res,
        "An application with this email address already exists."
      );
    }

    const application = new AgentApplication(payload);
    await application.save();

    return sendSuccess(
      res,
      "We have received your application. Our team will reach out to you shortly.",
      application
    );
  } catch (err) {
    if (err.code === 11000) {
      return badRequestError(
        res,
        "An application with this email address already exists."
      );
    }
    return sendError(res, "Unable to submit your agent application", 500);
  }
};

module.exports = {
  submitAgentApplication,
};
