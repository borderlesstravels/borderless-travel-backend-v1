const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const adminLoginTokenSchema = new Schema({
    challenge_hash: String,
    credential_digest: String,
    expires_at: Date,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now
    }
});

module.exports = mongoose.models.AdminLoginToken || mongoose.model('AdminLoginToken', adminLoginTokenSchema);
