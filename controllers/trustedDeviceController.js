const TrustedDevice = require("../models/TrustedDevice");
const { serverError } = require("../utilities/error");

const getTrustedDevice = async (req, res) => {
    try {
        const userid = req.user.userid;
        const trusted = await TrustedDevice.find({ userid }).sort({ addedAt: -1 });
        const total = await TrustedDevice.count({ userid });
        res.status(200).json({ trusted, total });
    } catch (error) {
        serverError(res, error);
    }
}

const deleteTrustedDevice = async (req, res) => {
    try {
        let id = req.params.id;
        await TrustedDevice.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Session was removed from Trusted Device!"
        });
    } catch (error) {
        serverError(res, error);
    }
};

module.exports = {
    getTrustedDevice,
    deleteTrustedDevice
}