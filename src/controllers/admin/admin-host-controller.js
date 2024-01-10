const bcrypt = require('bcryptjs');
const { sendError } = require('../../utils/helpers');
const { log } = require('console');
const Host = require('../../models/host/Host');

const updateHostProfile = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password);
  }
  try {
    const savedHostProfile = await Host.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Successfully updated the host profile',
      data: savedHostProfile,
    });
  } catch (err) {
    log(err);
    return sendError(res, 'Unable to update the host profile');
  }
};

const deleteHost = async (req, res) => {
  try {
    await Host.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully deleted the host profile',
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to delete the host profile');
  }
};

const fetchAllHosts = async (req, res, next) => {
  const { min, max, ...others } = req.query;
  try {
    const hosts = await Host.find({
      ...others,
      cheapestPrice: { $gt: min | 1, $lt: max || 999 },
    }).limit(req.query.limit);
    return res.status(200).json({ success: true, data: hosts });
  } catch (error) {
    return sendError(res, 'Unable to fetch the hosts data');
  }
};

const fetchSingleHost = async (req, res, next) => {
  const { id } = req.params;
  try {
    const host = await Host.findById(id);
    if (!host) {
      return sendError(res, 'Host profile does not exist');
    }
    return res.status(200).json({ success: true, data: host });
  } catch (error) {
    return sendError(res, 'Unable to fetch the host profile data');
  }
};

module.exports = {
  updateHostProfile,
  deleteHost,
  fetchAllHosts,
  fetchSingleHost,
};
