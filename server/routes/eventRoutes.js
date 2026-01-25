const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const {
  uploadEventFiles,
  validateEventBody,
  validateEventId,
  sanitizeEventNumbers
} = require("../middleware/eventMiddleware");

/* =========================================================
   EVENT TYPE ROUTES
========================================================= */

router.post("/event-types", eventController.createEventType);
router.put("/event-type/:id", validateEventId, eventController.updateEventType);
router.get("/event-types", eventController.getEventTypes);


/* =========================================================
   EVENT ROUTES
========================================================= */

// CREATE EVENT
router.post(
  "/events",
  uploadEventFiles,
  sanitizeEventNumbers,
  validateEventBody,
  eventController.createEvent
);

// GET ALL EVENTS
router.get("/events", eventController.getAllEvents);

// GET EVENT BY ID
router.get(
  "/events/:id",
  validateEventId,
  eventController.getEventById
);

// UPDATE EVENT
router.put(
  "/events/:id",
  validateEventId,
  uploadEventFiles,
  sanitizeEventNumbers,
  validateEventBody,
  eventController.updateEvent
);

// DELETE EVENT
router.delete(
  "/events/:id",
  validateEventId,
  eventController.deleteEvent
);

module.exports = router;
