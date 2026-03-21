const { file } = require("pdfkit");
const pool = require("../config/db");
const EventModel = require("../models/eventModel");
const fs = require('fs');
const path = require('path');

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
    console.error("Create Event Type Error:", err);
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
    console.error("Update Event Type Error:", err);
    res.status(500).json({ message: "Failed to update event type" });
  }
};


exports.getEventTypes = async (req, res) => {
  try {
    const data = await EventModel.getEventTypes();
    res.json(data);
  } catch (err) {
    console.error("Get Event Types Error:", err);
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

    /* ---------- SAVE PHOTOS ---------- */
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

    /* ---------- SAVE REPORTS (if any) ---------- */
    if (req.files?.reports) {
      for (const file of req.files.reports) {
        await EventModel.insertEventReport(client, [
          eventId,
          file.mimetype,
          file.path,
          file.originalname,
          created_by
        ]);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event_id: eventId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create Event Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create event"
    });

  } finally {
    client.release();
  }
};


/* =========================================================
   UPDATE EVENT
========================================================= */

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

    /* ---------- UPDATE EVENT MASTER ---------- */
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
      photos_to_delete,
      updated_by,
      id
    ]);

    if (photos_to_delete) {
      let idsToDelete = [];
      try {
        idsToDelete = JSON.parse(photos_to_delete);
      } catch(e) {
        console.error("Invalid photos_to_delete format:", e);
      }
      if (Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      const fetchFilesQuery = `SELECT file_path FROM event_photos WHERE photo_id = ANY($1::int[])`;
      const { rows: filesToRemove } = await client.query(fetchFilesQuery, [idsToDelete]);

      filesToRemove.forEach(file => {
        if (file.file_path && fs.existsSync(file.file_path)) {
          try {
            fs.unlinkSync(file.file_path);
            console.log(`Deleted file: ${file.file_path}`);
          } catch(error) {
            console.error(`Failed to delete file from disk: ${file.file_path}`, error);
          }
        }
      });
      
    const deletePhotosQuery = `DELETE FROM event_photos WHERE photo_id = ANY($1::int[])`;
    await client.query(deletePhotosQuery, [idsToDelete]);
    }
    }

    



    if (req.files?.photos && req.files.photos.length > 0) {

      for (const file of req.files.photos) {
        await EventModel.insertPhoto(client, [
          id,
          file.path,
          file.originalname,
          updated_by
        ]);
      }
    }

    /* ==================================================
       ADD NEW REPORTS (OPTIONAL)
    ================================================== */

    if (req.files?.reports && req.files.reports.length > 0) {

      for (const file of req.files.reports) {
        await EventModel.insertEventReport(client, [
          id,
          file.mimetype,
          file.path,
          file.originalname,
          updated_by
        ]);
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Event updated successfully (old photos preserved)"
    });

  } catch (err) {

    await client.query("ROLLBACK");
    console.error("Update Event Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update event"
    });

  } finally {
    client.release();
  }
};

/* =========================================================
   DELETE EVENT
========================================================= */

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    await EventModel.deleteEvent(id);

    res.json({
      success: true,
      message: "Event deleted successfully"
    });

  } catch (err) {
    console.error("Delete Event Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete event"
    });
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
    console.error("Get All Events Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
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

    res.json({
      ...event,
      photos,
      reports
    });

  } catch (err) {
    console.error("Get Event By Id Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event"
    });
  }
};

/* =========================================================
   FOR SAMMELAN EVENTS
========================================================= */

exports.getSammelanEvents = async (req, res) => {
    try {
        const events = await EventModel.getSammelanEvents();
        res.status(200).json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.getJurisdictionData = async (req, res) => {
    try {
        const { type, stateName, divisionNames, districtNames } = req.query;
        let data;

        if (type === 'state') data = await EventModel.getStates();
        else if (type === 'division') data = await EventModel.getDivisionsByState(stateName);
        else if (type === 'district') data = await EventModel.getDistrictsByDivisions(divisionNames);
        else if (type === 'block') data = await EventModel.getBlocksByMultiDistricts(stateName, divisionNames, districtNames);

        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.fetchStudentAttendanceList = async (req, res) => {
    try {
        const { eventTitle, stateName, districtNames, blockNames, page } = req.body;

        if (!eventTitle) {
            return res.status(400).json({ success: false, msg: "Event Title is required." });
        }

        const filters = {
            eventTitle,
            stateName: stateName || null,
            districtNames: (districtNames && districtNames.length > 0) ? districtNames : null,
            blockNames: (blockNames && blockNames.length > 0) ? blockNames : null,
            limit: 15,
            offset: ((page || 1) - 1) * 15
        };

        const students = await EventModel.getSammelanStudentList(filters);
        res.status(200).json({ success: true, data: students });
    } catch (err) {
        console.error("Query Error:", err.message);
        res.status(500).json({ success: false, msg: "Database error occurred." });
    }
};

exports.submitAttendance = async (req, res) => {
    try {
        const { eventId, studentIds } = req.body;
        const parsedStudentIds = typeof studentIds === 'string' ? JSON.parse(studentIds) : studentIds;
        
        // IMPORTANT: Database 'uploaded_by' is NUMERIC. 
        // If not logged in, we MUST use null, NOT the string 'ADMIN'.
        const userId = req.user?.user_id || null; 

        await EventModel.saveSammelanAttendance(pool, eventId, parsedStudentIds);

        if (req.files?.photos) {
            for (const file of req.files.photos) {
                // Sending EXACTLY 4 items to match the Model
                await EventModel.insertPhoto(pool, [
                    eventId,       // $1
                    file.path,     // $2
                    file.filename, // $3
                    userId         // $4 (Numeric or Null)
                ]);
            }
        }

        if (req.files?.reports) {
            const report = req.files.reports[0];
            // Sending EXACTLY 5 items to match the Model
            await EventModel.insertEventReport(pool, [
                eventId,           // $1
                'SAMMELAN_REPORT', // $2
                report.path,       // $3
                report.filename,   // $4
                userId             // $5 (Numeric or Null)
            ]);
        }

        res.status(200).json({ success: true, msg: "Saved successfully!" });
    } catch (err) {
        console.error("Save Error:", err.message);
        res.status(500).json({ success: false, msg: err.message });
    }
};