const SearchModel = require("../models/searchModel");

const searchController = {
  search: async (req, res) => {
    try {
      let {
        nmms_year,
        nmms_reg_number,
        student_name,
        medium,
        district,
        nmms_block,
        app_state,
        current_institute_dise_code,
        limit = 10,
        offset = 0,
        sort_by = "applicant_id",
        sort_order = "ASC",
      } = req.query;

      // Pagination
      const pageLimit = parseInt(limit, 10) || 10;
      const pageOffset = parseInt(offset, 10) || 0;

      // Safe sorting fields
      const sortableFields = [
        "applicant_id",
        "student_name",
        "nmms_year",
        "nmms_reg_number",
        "medium",
        "district",
        "nmms_block",
        "app_state",
        "current_institute_dise_code"
      ];

      const sortBySafe = sortableFields.includes(sort_by)
        ? sort_by
        : "applicant_id";

      const sortOrderSafe =
        sort_order && sort_order.toUpperCase() === "DESC"
          ? "DESC"
          : "ASC";

      // Trim inputs
      nmms_reg_number = nmms_reg_number?.trim();
      student_name = student_name?.trim();

      /**
       * If NMMS registration number is provided
       * ignore all other filters
       */
      let filters;

      if (nmms_reg_number) {
        filters = { nmms_reg_number };
      } else {
        filters = {
          nmms_year,
          student_name,
          medium,
          district,
          nmms_block,
          app_state,
          current_institute_dise_code
        };
      }

      // Remove empty filters
      filters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      // Call model
      const { rows, totalCount } = await SearchModel.searchStudents(
        filters,
        { limit: pageLimit, offset: pageOffset },
        { sortBy: sortBySafe, sortOrder: sortOrderSafe }
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "No applications found matching the criteria."
        });
      }

      // Send response
      res.json({
        data: rows,
        pagination: {
          total: totalCount,
          limit: pageLimit,
          offset: pageOffset,
          totalPages: Math.ceil(totalCount / pageLimit),
          currentPage: Math.floor(pageOffset / pageLimit) + 1,
          nextOffset:
            pageOffset + pageLimit < totalCount
              ? pageOffset + pageLimit
              : null,
          prevOffset:
            pageOffset - pageLimit >= 0
              ? pageOffset - pageLimit
              : null
        },
        sort: {
          sortBy: sortBySafe,
          sortOrder: sortOrderSafe
        }
      });

    } catch (error) {
      console.error("Error searching applications:", error);

      res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  getCohorts: async (req, res) => {
    try {
      const data = await SearchModel.getAllCohorts();
      res.json({ data });
    } catch (error) {
      console.error("Error fetching cohorts:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  getBatches: async (req, res) => {
    try {
      const { cohortNumber } = req.params;

      const data = await SearchModel.getBatchesByCohort(cohortNumber);

      res.json({ data });
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  }
};

module.exports = searchController;