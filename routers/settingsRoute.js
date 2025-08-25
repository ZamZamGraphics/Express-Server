const {
  getSettings,
  updateSettings,
  updatedEmail,
} = require("../controllers/settingsController");
const {
  settingsValidators,
  settingsValidationHandler,
} = require("../validator/settingsValidator");

const router = require("express").Router();

router.get("/", getSettings);
router.patch(
  "/:id",
  settingsValidators,
  settingsValidationHandler,
  updateSettings
);

module.exports = router;
