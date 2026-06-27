const mongoose = require("mongoose");
const AgentApplication = require("../../models/agent/AgentApplication");
const AgentEarning = require("../../models/agent/AgentEarning");
const AgentWithdrawal = require("../../models/agent/AgentWithdrawal");
const FlightBooking = require("../../models/general/FlightBooking");
const {
  sendError,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");

const APPROVED_AGENT_STATUSES = ["approved", "suspended"];

const getPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const fetchAllAgentApplications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 0;
    const query = AgentApplication.find().sort({ created_at: -1 });
    if (limit > 0) {
      query.limit(limit);
    }
    const applications = await query;
    return sendSuccess(
      res,
      "Successfully fetched agent applications",
      applications
    );
  } catch (err) {
    return sendError(
      res,
      "Something went wrong. Could not fetch agent applications.",
      500
    );
  }
};

const searchApprovedAgents = async (req, res) => {
  const search = String(req.query.search || "").trim();

  try {
    const filter = {
      status: { $in: APPROVED_AGENT_STATUSES },
    };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ full_name: regex }, { email: regex }];
    }

    const agents = await AgentApplication.find(filter)
      .select("full_name email phone status available_balance")
      .sort({ full_name: 1 })
      .limit(20);

    return sendSuccess(res, "Successfully fetched approved agents", agents);
  } catch (err) {
    return sendError(res, "Unable to search approved agents", 500);
  }
};

const fetchAgentApplicationById = async (req, res) => {
  try {
    const application = await AgentApplication.findById(req.params.id);
    if (!application) {
      return badRequestError(res, "Agent application not found");
    }
    return sendSuccess(
      res,
      "Successfully fetched agent application",
      application
    );
  } catch (err) {
    return sendError(res, "Unable to fetch agent application", 500);
  }
};

const fetchAgentEarnings = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  try {
    const agent = await AgentApplication.findById(req.params.id);
    if (!agent) {
      return badRequestError(res, "Agent application not found");
    }

    const [earnings, total] = await Promise.all([
      AgentEarning.find({ agent: req.params.id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AgentEarning.countDocuments({ agent: req.params.id }),
    ]);

    return sendSuccess(res, "Successfully fetched agent earnings", {
      earnings,
      total,
      page,
      limit,
    });
  } catch (err) {
    return sendError(res, "Unable to fetch agent earnings", 500);
  }
};

const fetchAgentWithdrawals = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  try {
    const agent = await AgentApplication.findById(req.params.id);
    if (!agent) {
      return badRequestError(res, "Agent application not found");
    }

    const [withdrawals, total] = await Promise.all([
      AgentWithdrawal.find({ agent: req.params.id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AgentWithdrawal.countDocuments({ agent: req.params.id }),
    ]);

    return sendSuccess(res, "Successfully fetched agent withdrawals", {
      withdrawals,
      total,
      page,
      limit,
    });
  } catch (err) {
    return sendError(res, "Unable to fetch agent withdrawals", 500);
  }
};

const updateAgentApplicationStatus = async (req, res) => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return badRequestError(res, "Invalid agent application id");
  }

  try {
    const application = await AgentApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!application) {
      return badRequestError(res, "Agent application not found");
    }
    return sendSuccess(
      res,
      "Successfully updated agent application status",
      application
    );
  } catch (err) {
    return sendError(res, "Unable to update agent application status", 500);
  }
};

const deleteAgentApplication = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return badRequestError(res, "Invalid agent application id");
  }

  try {
    const application = await AgentApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return badRequestError(res, "Agent application not found");
    }
    return sendSuccess(res, "Successfully deleted agent application");
  } catch (err) {
    return sendError(res, "Unable to delete agent application", 500);
  }
};

const addFlightAgentCommission = async (req, res) => {
  const { agent_id, amount, booking_reference } = req.body;
  const commissionAmount = Number(amount);

  try {
    const agent = await AgentApplication.findById(agent_id);
    if (!agent) {
      return badRequestError(res, "Agent not found");
    }
    if (!APPROVED_AGENT_STATUSES.includes(agent.status)) {
      return badRequestError(
        res,
        "Commission can only be added for approved agents"
      );
    }

    const booking = await FlightBooking.findOne({ booking_reference });
    if (!booking) {
      return badRequestError(res, "Flight booking not found");
    }

    const existingEarning = await AgentEarning.findOne({
      booking_reference,
      service: "flight",
    });
    if (existingEarning) {
      return badRequestError(
        res,
        "Commission has already been added for this booking"
      );
    }

    const passenger = booking.passenger_details?.[0] || {};
    const customerName =
      `${passenger.first_name || ""} ${passenger.last_name || ""}`.trim() ||
      "N/A";
    const customerEmail =
      booking.contact_details?.email || booking.owner || "N/A";

    const earning = new AgentEarning({
      agent: agent_id,
      booking_reference,
      service: "flight",
      amount: commissionAmount,
      customer_name: customerName,
      customer_email: customerEmail,
      origin: booking.origin,
      destination: booking.destination,
      action_by: req.id,
    });

    await earning.save();

    agent.available_balance = (agent.available_balance || 0) + commissionAmount;
    await agent.save();

    return sendSuccess(res, "Agent commission added successfully", {
      earning,
      agent,
    });
  } catch (err) {
    if (err.code === 11000) {
      return badRequestError(
        res,
        "Commission has already been added for this booking"
      );
    }
    return sendError(res, "Unable to add agent commission", 500);
  }
};

const addManualAgentCommission = async (req, res) => {
  const {
    agent_id,
    amount,
    booking_reference,
    customer_name,
    customer_email,
    origin,
    destination,
  } = req.body;
  const commissionAmount = Number(amount);

  try {
    const agent = await AgentApplication.findById(agent_id);
    if (!agent) {
      return badRequestError(res, "Agent not found");
    }
    if (!APPROVED_AGENT_STATUSES.includes(agent.status)) {
      return badRequestError(
        res,
        "Commission can only be added for approved agents"
      );
    }

    const existingEarning = await AgentEarning.findOne({
      booking_reference,
      service: "flight",
    });
    if (existingEarning) {
      return badRequestError(
        res,
        "Commission has already been added for this booking"
      );
    }

    const earning = new AgentEarning({
      agent: agent_id,
      booking_reference,
      service: "flight",
      amount: commissionAmount,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      action_by: req.id,
    });

    await earning.save();

    agent.available_balance = (agent.available_balance || 0) + commissionAmount;
    await agent.save();

    return sendSuccess(res, "Agent commission recorded successfully", {
      earning,
      agent,
    });
  } catch (err) {
    if (err.code === 11000) {
      return badRequestError(
        res,
        "Commission has already been added for this booking"
      );
    }
    return sendError(res, "Unable to record agent commission", 500);
  }
};

const checkFlightAgentCommission = async (req, res) => {
  const { booking_reference } = req.params;

  try {
    const earning = await AgentEarning.findOne({
      booking_reference,
      service: "flight",
    });

    return sendSuccess(res, "Successfully checked flight commission status", {
      has_commission: !!earning,
      earning: earning || null,
    });
  } catch (err) {
    return sendError(res, "Unable to check flight commission status", 500);
  }
};

module.exports = {
  fetchAllAgentApplications,
  searchApprovedAgents,
  fetchAgentApplicationById,
  fetchAgentEarnings,
  fetchAgentWithdrawals,
  updateAgentApplicationStatus,
  deleteAgentApplication,
  checkFlightAgentCommission,
  addFlightAgentCommission,
  addManualAgentCommission,
};
