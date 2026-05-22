const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById,
  getEventUsers
} = require("../controllers/events.controller");

router.get("/", getEvents);
router.get("/:id", getEventById);
router.get("/:id/users", getEventUsers);

module.exports = router;