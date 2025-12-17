const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");

// Get event types
router.get("/types/all", eventController.getEventTypes);

// Create event type
router.post("/types", eventController.createEventType);

// Create Event
router.post("/", eventController.createEvent);

// Get all events
router.get("/", eventController.getAllEvents);

// Get single event
router.get("/:eventId", eventController.getEventById);

// Delete event
router.delete("/:eventId", eventController.deleteEvent);


module.exports = router;
