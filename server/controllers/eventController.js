const pool = require("../config/db");
const EventModel = require("../models/eventModel");

/* =========================================================
   EVENT TYPE CONTROLLERS
========================================================= */

exports.createEventType = async (req, res) => {
  try {
    const { event_type_name } = req.body;

    if (!event_type_name) {
      return res.status(400).json({ message: "Event type name is required" });
    }

    const data = await EventModel.createEventType(event_type_name);
    res.status(201).json(data);

  } catch (err) {
    console.error("Error creating event type:", err);
    res.status(500).json({ message: "Failed to create event type" });
  }
};


exports.updateEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type_name } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event type id" });
    }

    const data = await EventModel.updateEventType(id, event_type_name);
    res.json(data);

  } catch (err) {
    console.error("Error updating event type:", err);
    res.status(500).json({ message: "Failed to update event type" });
  }
};


exports.getEventTypes = async (req, res) => {
  try {
    const data = await EventModel.getEventTypes();
    res.json(data);
  } catch (err) {
    console.error("Error fetching event types:", err);
    res.status(500).json({ message: "Failed to fetch event types" });
  }
};


/* =========================================================
   EVENT MASTER CONTROLLERS
========================================================= */

exports.createEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      event_type_id,
      event_title,
      event_description,
      event_start_date,
      event_end_date,
      event_district,
      event_block,
      event_location,
      pincode,
      cohort_number,
      boys_attended = 0,
      girls_attended = 0,
      parents_attended = 0
    } = req.body;

    const created_by = req.user?.user_id || null;

    const eventId = await EventModel.createEvent(client, [
      event_type_id,
      event_title,
      event_description,
      event_start_date,
      event_end_date,
      event_district,
      event_block,
      event_location,
      pincode,
      cohort_number,
      boys_attended,
      girls_attended,
      parents_attended,
      created_by
    ]);

    // Photos upload
    if (req.files?.photos) {
      for (const file of req.files.photos) {
        await EventModel.insertPhoto(client, [
          eventId,
          file.path,
          file.originalname,
          created_by
        ]);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Event created", event_id: eventId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Failed to create event" });

  } finally {
    client.release();
  }
};


exports.updateEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    await client.query("BEGIN");

    const {
      event_type_id,
      event_title,
      event_description,
      event_start_date,
      event_end_date,
      event_district,
      event_block,
      event_location,
      pincode,
      cohort_number,
      boys_attended,
      girls_attended,
      parents_attended
    } = req.body;

    const updated_by = req.user?.user_id || null;

    await EventModel.updateEvent(client, [
      event_type_id,
      event_title,
      event_description,
      event_start_date,
      event_end_date,
      event_district,
      event_block,
      event_location,
      pincode,
      cohort_number,
      boys_attended,
      girls_attended,
      parents_attended,
      updated_by,
      id
    ]);

    await client.query("COMMIT");
    res.json({ message: "Event updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Failed to update event" });

  } finally {
    client.release();
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    await EventModel.deleteEvent(id);
    res.json({ message: "Event deleted successfully" });

  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};


/* =========================================================
   FETCH EVENTS
========================================================= */

exports.getAllEvents = async (req, res) => {
  try {
    const data = await EventModel.getAllEvents();
    res.json(data);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};


exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await EventModel.getEventById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const photos = await EventModel.getEventPhotos(id);
    const reports = await EventModel.getEventReports(id);

    res.json({ ...event, photos, reports });

  } catch (err) {
    console.error("Error getEventById:", err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
};
