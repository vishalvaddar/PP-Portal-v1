const EventModel = require("../models/eventModel");

const EventController = {

  // ==============================
  // CREATE EVENT + PHOTOS
  // ==============================
  async createEvent(req, res) {
    try {
      // req.body → event data
      // req.files → uploaded photos (from multer)
      const eventId = await EventModel.insertEvent(req.body, req.files, req.user);

      res.status(201).json({
        message: "Event created successfully",
        eventId
      });
    } catch (err) {
      console.error("Create Event Error:", err);
      res.status(400).json({ msg: err.message });
    }
  },

  // ==============================
  // GET ALL EVENTS
  // ==============================
  async getAllEvents(req, res) {
    try {
      const events = await EventModel.getAllEvents();
      res.json(events);
    } catch (err) {
      console.error("Error getAllEvents:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  },

  // ==============================
  // GET EVENT BY ID (WITH PHOTOS)
  // ==============================
  async getEventById(req, res) {
    try {
      const eventId = req.params.event_id;
      const event = await EventModel.getEventById(eventId);

      if (!event) {
        return res.status(404).json({ msg: "Event not found" });
      }

      res.json(event);
    } catch (err) {
      console.error("Error getEventById:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  },

  // ==============================
  // UPDATE EVENT + ADD NEW PHOTOS
  // ==============================
  async updateEvent(req, res) {
    try {
      const eventId = req.params.eventId;

      const updated = await EventModel.updateEvent(
        eventId,
        req.body,
        req.files,
        req.user
      );

      res.json({
        message: "Event updated successfully",
        updated
      });
    } catch (err) {
      console.error("Update Event Error:", err);
      res.status(400).json({ msg: err.message });
    }
  },

  // ==============================
  // DELETE EVENT (PHOTOS CASCADE)
  // ==============================
  async deleteEvent(req, res) {
    try {
      await EventModel.deleteEvent(req.params.eventId);

      res.json({ message: "Event deleted successfully" });
    } catch (err) {
      console.error("Delete Event Error:", err);
      res.status(500).json({ msg: err.message });
    }
  },

  // ==============================
  // GET EVENT TYPES
  // ==============================
  async getEventTypes(req, res) {
    try {
      const types = await EventModel.getEventTypes();
      res.json(types);
    } catch (err) {
      console.error("Error getEventTypes:", err);
      res.status(500).json([]);
    }
  },

  // ==============================
  // CREATE EVENT TYPE
  // ==============================
  async createEventType(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ msg: "Event type name required" });
      }

      const newType = await EventModel.createEventType(name);
      res.status(201).json(newType);

    } catch (err) {
      console.error("Error createEventType:", err);

      if (err.code === "23505") {
        return res.status(409).json({ msg: "Event type already exists" });
      }

      res.status(500).json({ msg: err.message });
    }
  }
};

module.exports = EventController;
