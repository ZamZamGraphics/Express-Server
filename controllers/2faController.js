const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TrustedDevice = require("../models/TrustedDevice");
const { serverError, resourceError } = require("../utilities/error");
const speakeasy = require("speakeasy");

// Enable 2FA
const setup2FA = async (req, res) => {
    try {
        const userid = req.user.userid;
        const secret = speakeasy.generateSecret({
            name: "Al Madina IT : App",
            issuer: "Al Madina IT"
        });

        // Update User with twoFASecret
        await User.findByIdAndUpdate(userid, {
            twoFASecret: secret.base32,
            is2FAEnabled: false
        });

        res.status(200).json({
            success: true,
            message: "2FA Setup Initiated",
            otpauth_url: secret.otpauth_url,
            secret: secret.base32
        });

    } catch (err) {
        return serverError(res, err);
    }
}

// Verify 2FA
const confirm2FASetup = async (req, res) => {
    try {
        const userid = req.user.userid
        const token = req.body.token;

        const user = await User.findById(userid);
        if (!user.twoFASecret) return resourceError(res, { message: "2FA not enabled" });

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: "base32",
            token,
            window: 2
        });

        if (!verified) return resourceError(res, { message: "Invalid 2FA token" });

        await User.findByIdAndUpdate(userid, { is2FAEnabled: true });

        res.status(200).json({ success: true, message: "2FA setup complete" });
    } catch (err) {
        return serverError(res, err);
    }
}

// Disable 2FA
const disable2FA = async (req, res) => {
    try {
        const userid = req.user.userid;
        const password = req.body.password;
        const user = await User.findById(userid);

        if (!user) return resourceError(res, { message: "User not exists!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return resourceError(res, { message: "The password is incorrect!" });

        // Update User
        await User.findByIdAndUpdate(userid, {
            twoFASecret: null,
            is2FAEnabled: false
        });

        res.status(200).json({ success: true, message: "2FA Disabled Successfully" });
    } catch (err) {
        console.log(err)
        return serverError(res, err);
    }
}

const complete2FALogin = async (req, res) => {
    try {
        const { userid, token, deviceId } = req.body;
        const ua = req.useragent;
        let device = "Unknown Device";

        if (ua.isMobile) device = "Mobile";
        else if (ua.isTablet) device = "Tablet";
        else if (ua.isDesktop) device = "Desktop";

        const user = await User.findById(userid);
        if (!user.twoFASecret) return resourceError(res, { message: "2FA not enabled" });

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: "base32",
            token,
            window: 2
        });

        if (!verified) return resourceError(res, { message: "Invalid 2FA code" });

        const exists = await TrustedDevice.findOne({ userid, deviceId });

        if (!exists) {
            await TrustedDevice.create({
                userid,
                deviceId,
                device,
                os: ua.os,
                browser: ua.browser,
                ip: req.ip
            });
        }

        // generate token
        const jwtToken = jwt.sign({ userid: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRY,
        });
        res.status(200).json({ success: true, userid: user._id, token: jwtToken });
    } catch (err) {
        return serverError(res, err);
    }
}

module.exports = {
    setup2FA,
    confirm2FASetup,
    disable2FA,
    complete2FALogin,
};
