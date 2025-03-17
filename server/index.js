const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const pool = require("./config/db");
const applicantCreateRoutes = require("./routes/applicantCreateRoutes");
const applicantViewRoutes = require("./routes/applicantViewRoutes");
const applicantUpdateRoutes = require("./routes/applicantUpdateRoutes");
const applicantDeleteRoutes = require("./routes/applicantDeleteRoutes");
const bulkUploadRoutes = require("./routes/bulkUploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/applicants/create", applicantCreateRoutes);
app.use("/applicants", applicantViewRoutes);
app.use("/applicants/update", applicantUpdateRoutes);
app.use("/applicants/delete", applicantDeleteRoutes);
app.use("/api", bulkUploadRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
