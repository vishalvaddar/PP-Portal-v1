import React, { useState, useEffect } from "react";
import { FaMinusCircle } from "react-icons/fa";
import axios from "axios";
import classes from "./GenerateTimeTable.module.css";
import TimeTableView from "./TimeTableView";
import { useParams, useSearchParams } from "react-router-dom";

export default function TimeTableDashboard() {
  const BASE = `${process.env.REACT_APP_BACKEND_API_URL}/api/timetable`;

  /* ---------- CONSTANTS ---------- */
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const weeklySlots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const [userName, setUserName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [step, setStep] = useState(1);
  const [visibleTables, setVisibleTables] = useState({slots: false,subjects: false,teachers: false,overrides: false});
  const [slotDaysDtls, setSlotDaysDtls] = useState([{slot: "slot-1",days: [...days],startTime: "",endTime: ""}]);
  const [subjects, setSubjects] = useState([]);
  const [subjectWeeklySlotDtls, setSubjectWeeklySlotDtls] = useState([{ subjectDtlsForWeeklySlot: {}, weeklySlot: "" }]);
  const [teachers, setTeachers] = useState([]);
  const [teacherAvailabilityDtls, setTeacherAvailabilityDtls] = useState([{ teacherDtls: {}, availability: {}, teachersBySubjects: [] }]);
  const [overrideDtls, setOverrideDtls] = useState([{ teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: [], subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);

  const [reportContent, setReportContent] = useState(""); // for the text of the report
  const [showReportModal, setShowReportModal] = useState(false);
  const [genratedTimeTableData, setGenratedTimeTableData] = useState({});
  const [showGenratedTimeTableData, setShowGenratedTimeTableData] = useState(false);

  const { id } = useParams(); // This gets the :id from the URL
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode"); // This gets "edit" or "copy"

 /* ---------- LOAD DATA ---------- */
useEffect(() => {
  const initializePage = async () => {
    // 1. Always load subjects first (for the dropdowns/selection)
    await loadSubjects();

    // 2. If there's an ID, fetch the draft details
    if (id) {
      fetchDraftDetails(id);
    }
  };

  initializePage();
}, [id]); // Re-run if ID changes

 const fetchDraftDetails = async (configId) => {
  try {
    const res = await axios.get(`${BASE}/timeTable/getConfigById/${configId}`);
    const draftData = res.data;

    // If mode is 'copy', we might want to clear the name or ID 
    // so the user doesn't accidentally overwrite the original.
    // if (mode === 'copy') {
    //   setFormData({
    //     ...draftData,
    //     config_file_name: `${draftData.config_file_name} (Copy)`,
    //     config_id: null // Ensure it saves as new
    //   });
    // } else {
    //   setFormData(draftData); // 'edit' mode: load everything as is
    // }

    console.log(`${mode} data loaded successfully`);
  } catch (err) {
    console.error("Error fetching draft details:", err);
    alert("Failed to load configuration data.");
  }
};

  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${BASE}/data/subjectsForTimeTable`);
      setSubjects(res.data);
    } catch (err) {
      console.log(err);
    }
  };


  /* ---------- SLOT TABLE ---------- */
  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const showTable = (type) => {
    setVisibleTables(prev => ({...prev,[type]: true}));
  };


  const addSlotDaysDtls = () => {
    
    if (!visibleTables.slots) {
    showTable("slots");
    return;
  }

    const newSlotNumber = slotDaysDtls.length + 1;
    setSlotDaysDtls([
      ...slotDaysDtls,
      {
        slot: `Slot-${newSlotNumber}`,
        days: [...days],
        startTime: "",
        endTime: ""
      }
    ]);
  };


  const handleTimeChange = (index, field, value) => {
    const newRows = [...slotDaysDtls];
    const row = { ...newRows[index], [field]: value };
    // Validation
    if (field === "startTime" && row.endTime && value >= row.endTime) {
      alert("Start time must be less than end time");
      return;
    }
    if (field === "endTime" && row.startTime && value <= row.startTime) {
      alert("End time must be greater than start time");
      return;
    }
    newRows[index] = row;
    setSlotDaysDtls(newRows);
  };

  const handleDayChange = (index, day) => {
    const newRows = [...slotDaysDtls];
    const row = { ...newRows[index] };
    if (row.days.includes(day)) {
      row.days = row.days.filter(d => d !== day);
    } else {
      row.days = [...row.days, day];
    }
    newRows[index] = row;
    setSlotDaysDtls(newRows);
  };

  const removeSlotDayDtls = (index) => {
    const newRows = slotDaysDtls.filter((_, i) => i !== index);
    setSlotDaysDtls(newRows);
  };


  /* ---------- SUBJECT TABLE ---------- */
  const addSubjectWeeklySlotDtls = () => {
    if (!visibleTables.subjects) {
      showTable("subjects");
      return;
    }

    const lastRow = subjectWeeklySlotDtls[subjectWeeklySlotDtls.length - 1];
    if (!lastRow.subjectDtlsForWeeklySlot.subjectId || !lastRow.weeklySlot) {
      alert("Select Subject and Weekly Slot");
      return;
    }
    const duplicate = subjectWeeklySlotDtls.slice(0, -1).some(r => r.subjectDtlsForWeeklySlot.subjectId === lastRow.subjectDtlsForWeeklySlot.subjectId);
    if (duplicate || 1 == 2) {//no need as of now
      alert("Duplicate Subject not allowed");
      return;
    }
    setSubjectWeeklySlotDtls([...subjectWeeklySlotDtls, { subjectDtlsForWeeklySlot: {}, weeklySlot: "" }]);
  };


  const handleSubjectChange = async (index, value) => {
    if (value == "") {
      let newRows = [...subjectWeeklySlotDtls];
      newRows[index].subjectDtlsForWeeklySlot = { subjectId: "", grade: "" };
      setSubjectWeeklySlotDtls(newRows);
      const subjectIds = subjectWeeklySlotDtls.map(row => row.subjectDtlsForWeeklySlot.subjectId).filter(id => id !== "");
      if (subjectIds.length === 0) {
        alert("all data for below tables will be cleared because no selection for subjects");
        setTeacherAvailabilityDtls([{ teacherDtls: {}, availability: {}, teachersBySubjects: [] }]);
        setOverrideDtls([{ teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: [], subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);
        return;
      } else {
        const subjectIds = subjectWeeklySlotDtls.map(row => row.subjectDtlsForWeeklySlot.subjectId).filter(id => id !== "");
        try {
          const res = await axios.post(`${BASE}/teachers/getTeachersBySubjects`, { subjectIds });
          const teachersList = res.data;
          let updatedRows;
          if (!teacherAvailabilityDtls || teacherAvailabilityDtls.length === 0) {
            updatedRows = [{ teacherId: "", availability: {}, teachersBySubjects: teachersList }];
          } else {
            updatedRows = teacherAvailabilityDtls.map(row => ({ ...row, teachersBySubjects: teachersList }));
          }
          setTeacherAvailabilityDtls(updatedRows);
        } catch (error) {
          console.error("Error fetching teachers:", error);
        }
      }
    } else {
      let newRows = [...subjectWeeklySlotDtls];
      const [subjectId, grade] = value.split("_");
      newRows[index].subjectDtlsForWeeklySlot.subjectId = subjectId;
      newRows[index].subjectDtlsForWeeklySlot.grade = grade;
      setSubjectWeeklySlotDtls(newRows);
      // Duplicate validation
      const duplicate = newRows.some((row, i) => i !== index && row.subjectDtlsForWeeklySlot.subjectId === subjectId);
      if (!duplicate) {
        const subjectIds = subjectWeeklySlotDtls.map(row => row.subjectDtlsForWeeklySlot.subjectId).filter(id => id !== "");
        try {
          const res = await axios.post(`${BASE}/teachers/getTeachersBySubjects`, { subjectIds });
          const teachersList = res.data;
          let updatedRows;
          if (!teacherAvailabilityDtls || teacherAvailabilityDtls.length === 0) {
            updatedRows = [{ teacherId: "", availability: {}, teachersBySubjects: teachersList }];
          } else {
            updatedRows = teacherAvailabilityDtls.map(row => ({ ...row, teachersBySubjects: teachersList }));
          }
          setTeacherAvailabilityDtls(updatedRows);
        } catch (error) {
          console.error("Error fetching teachers:", error);
        }
      }
    }
  };

  const handleWeeklySlotChange = (index, value) => {
    let newRows = [...subjectWeeklySlotDtls];
    newRows[index].weeklySlot = value;
    setSubjectWeeklySlotDtls(newRows);
  };


  const removeSubjectWeeklySlotDtls = async (index) => {
    try {
      // Step 1: Prepare new rows after removing the selected subject
      const newRows = subjectWeeklySlotDtls.filter((_, i) => i !== index);
      const updatedRows = newRows.length
        ? newRows
        : [{ subjectDtlsForWeeklySlot: {}, weeklySlot: "" }];

      // Get all subject IDs **before removal** for dependency check
      const currentSubjectIds = subjectWeeklySlotDtls
        .map(row => row.subjectDtlsForWeeklySlot?.subjectId)
        .filter(id => id);

      if (currentSubjectIds.length === 0) {
        alert("All data for below tables will be cleared because no selection for subjects");
        setSubjectWeeklySlotDtls(updatedRows);
        setTeacherAvailabilityDtls([{ teacherDtls: {}, availability: {}, teachersBySubjects: [] }]);
        setOverrideDtls([{
          teacherIdDtlsForoverride: "",
          subjectDtlsForoverride: {},
          batchDtlsForoverride: "",
          dayDtlsForoverride: "",
          slotDtlsForoverride: "",
          selectedTecaherDtlsDtlsForoverride: [],
          subjectsDtlsForoverride: [],
          batchesDtlsForoverride: [],
          daysDtlsForoverride: [],
          slotsDtlsForoverride: []
        }]);
        return;
      }
      let res = await axios.post(`${BASE}/teachers/getTeachersBySubjects`, { subjectIds: currentSubjectIds });
      let teachersList = res.data;

      const selectedTeacherIds = teacherAvailabilityDtls
        .map(row => row.teacherDtls?.teacherId)
        .filter(id => id);

      const invalidTeacherSelected = selectedTeacherIds
        .some(id => !teachersList.some(t => String(t.teacher_id) === String(id)));

      if (invalidTeacherSelected) {
        alert("Cannot remove subject because a dependent teacher is already selected.");
        return; // Stop removal
      }
      const remainingSubjectIds = updatedRows
        .map(row => row.subjectDtlsForWeeklySlot?.subjectId)
        .filter(id => id);

      let updatedTeachersList = [];
      if (remainingSubjectIds.length !== 0) {
        const res2 = await axios.post(`${BASE}/teachers/getTeachersBySubjects`, { subjectIds: remainingSubjectIds });
        updatedTeachersList = res2.data;
      }
      setSubjectWeeklySlotDtls(updatedRows);
      const teacherRows = teacherAvailabilityDtls.length === 0
        ? [{ teacherDtls: {}, availability: {}, teachersBySubjects: updatedTeachersList }]
        : teacherAvailabilityDtls.map(row => ({ ...row, teachersBySubjects: updatedTeachersList }));

      setTeacherAvailabilityDtls(teacherRows);
    } catch (error) {
      console.error("Error removing subject or fetching teachers:", error);
    }
  };

  /* ---------- TEACHER TABLE ---------- */

  const addTeacherAvailabilityDtls = () => {
    if (!visibleTables.teachers) {
      showTable("teachers");
      return;
    }

    
    const lastRow = teacherAvailabilityDtls[teacherAvailabilityDtls.length - 1];
    if (!lastRow.teacherDtls.teacherId) {
      alert("Select Teacher");
      return;
    }
    setTeacherAvailabilityDtls([...teacherAvailabilityDtls, { teacherDtls: {}, availability: {}, teachersBySubjects: lastRow.teachersBySubjects }]);
  };

  const handleTeacherChange = (index, teacherId) => {
    let newRows = [...teacherAvailabilityDtls];
    if (teacherId === "") {
      newRows[index].teacherDtls = {};
      const selectedTeacherIds = newRows.map(row => row.teacherDtls?.teacherId).filter(id => id);
      if (selectedTeacherIds.length === 0) {
        alert("All selected teachers will be cleared");
        setOverrideDtls([{ teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: [], subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);
        return;
      } else {
        const overrideTeacherIds = overrideDtls.map(row => row.teacherIdDtlsForoverride).filter(id => id);
        const invalidTeachers = overrideTeacherIds.filter(id => !selectedTeacherIds.includes(id));
        if (invalidTeachers.length > 0) {
          alert("Cannot remove this teacher because it is already used in override rows11111.");
          return;
        }
      }
      setTeacherAvailabilityDtls(newRows);
    } else {
      let newRows = [...teacherAvailabilityDtls];
      const teacher = newRows[index].teachersBySubjects?.find(t => String(t.teacher_id) === String(teacherId));
      if (teacher) { newRows[index].teacherDtls = { teacherId: teacher.teacher_id, teacherName: teacher.teacher_name }; }
      const selectedTeacherIds = newRows.map(row => row.teacherDtls?.teacherId).filter(id => id);
      const overrideTeacherIds = overrideDtls.map(row => row.teacherIdDtlsForoverride).filter(id => id);
      const invalidTeachers = overrideTeacherIds.filter(id => !selectedTeacherIds.includes(id));
      // value which was there before changing was needed by the overriders
      if (invalidTeachers.length > 0) {
        alert("Cannot remove this teacher because it is already used in override rows.");
        return;
      }
      //value which we is getting added is alredy present in the overriders
      const alreadyExists = newRows.some((row, i) => i !== index && row.teacherDtls?.teacherId === teacherId);
      let updatedOverride;
      if (!alreadyExists) {
        const selectedTeacherDtls = [
          ...new Map(
            newRows
              .map(row => row.teacherDtls)
              .filter(t => t?.teacherId)
              .map(t => [t.teacherId, t])
          ).values()
        ];
        updatedOverride = overrideDtls.map(row => ({ ...row, selectedTecaherDtlsDtlsForoverride: selectedTeacherDtls }));
        setOverrideDtls(updatedOverride);     // Update override states
      }
      setTeacherAvailabilityDtls(newRows); // Update state
    }
  };

  const handleAvailabilityChange = (rowIndex, day, slot) => {
    let newRows = [...teacherAvailabilityDtls];

    const teacherId = newRows[rowIndex].teacherDtls.teacherId;
    if (!teacherId) {
      alert("Please select teacher first");
      return;
    }

    if (!newRows[rowIndex].availability[day]) {
      newRows[rowIndex].availability[day] = [];
    }
    if (newRows[rowIndex].availability[day].includes(slot)) {
      newRows[rowIndex].availability[day] =
        newRows[rowIndex].availability[day].filter(s => s !== slot);
    } else {
      newRows[rowIndex].availability[day].push(slot);
    }
    setTeacherAvailabilityDtls(newRows);

    if (!overrideDtls || overrideDtls.length === 0) {
      return;   // nothing to update
    }

    const availability = newRows[rowIndex].availability;

    const days = Object.keys(availability).filter(day => availability[day] && availability[day].length > 0);


    let updatedOverrideRows = overrideDtls.map(row => {
      if (row.teacherIdDtlsForoverride == teacherId) {
        return { ...row, daysDtlsForoverride: days, };
      } return row;
    });

    setOverrideDtls(updatedOverrideRows);
  };

  const removeTeacherAvailabilityDtls = (index) => {
    const newRows = teacherAvailabilityDtls.filter((_, i) => i !== index);
    const updatedRows = newRows.length ? newRows : [{ teacherDtls: {}, availability: {}, teachersBySubjects: [] }];
    const teacherIds = teacherAvailabilityDtls.map(row => row.teacherDtls?.teacherId).filter(id => id);
    if (teacherIds.length === 0) {
      alert("All data for below tables will be cleared because no selection for teachers");
      setTeacherAvailabilityDtls(updatedRows);
      setOverrideDtls([{ teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: [], subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);
      return;
    }
    const selectedTeacherIds = overrideDtls.flatMap(row => row.teacherIdDtlsForoverride);
    // Check if removing this row breaks override dependencies
    const invalidTeacherSelected = selectedTeacherIds.some(id => !teacherIds.includes(id));
    if (invalidTeacherSelected) {
      alert("Cannot remove teacher because a dependent teacher is already selected.");
      return;
    }
    setTeacherAvailabilityDtls(updatedRows);

    const overrideRows = overrideDtls.length ?
      overrideDtls.map(row => ({ ...row, selectedTecaherDtlsDtlsForoverride: updatedRows.map(r => r.teacherDtls).filter(t => t?.teacherId) }))
      : [{
        teacherIdDtlsForoverride: "",
        subjectDtlsForoverride: {},
        batchDtlsForoverride: "",
        dayDtlsForoverride: "",
        slotDtlsForoverride: "",
        selectedTecaherDtlsDtlsForoverride: [],
        subjectsDtlsForoverride: [],
        batchesDtlsForoverride: [],
        daysDtlsForoverride: [],
        slotsDtlsForoverride: []
      }];

    setOverrideDtls(overrideRows);
  };


  /* ---------- OVERRIDES TABLE ---------- */

  const addOverrideDtls = () => {
    if (!visibleTables.overrides) {
      showTable("overrides");
      return;
    }
    const last = overrideDtls[overrideDtls.length - 1];
    if (!last.teacherIdDtlsForoverride || !last.subjectDtlsForoverride || !last.batchDtlsForoverride) {
      alert("Fill all override fields");
      return;
    }
    setOverrideDtls([...overrideDtls, { teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: last.selectedTecaherDtlsDtlsForoverride, subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);
  };

  const removeOverrideDtls = (index) => {
    const newRows = overrideDtls.filter((_, i) => i !== index);
    if (overrideDtls.length === 1) {
      alert("At least one override row must be present");
      return; // prevent removing the last row
    }
    setOverrideDtls(newRows.length ? newRows : [{ teacherIdDtlsForoverride: "", subjectDtlsForoverride: {}, batchDtlsForoverride: "", dayDtlsForoverride: "", slotDtlsForoverride: "", selectedTecaherDtlsDtlsForoverride: [], subjectsDtlsForoverride: [], batchesDtlsForoverride: [], daysDtlsForoverride: [], slotsDtlsForoverride: [] }]);
  };

  const handleTeacherChangeOverrideRows = async (index, value) => {
    let newRows = [...overrideDtls];
    newRows[index].teacherId = value;

    if (value === "") {
      // Teacher deselected → reset selected values only
      newRows[index].teacherIdDtlsForoverride = value;
      newRows[index].subjectDtlsForoverride = {};
      newRows[index].batchDtlsForoverride = "";
      newRows[index].dayDtlsForoverride = "";
      newRows[index].slotDtlsForoverride = "";
      newRows[index].subjectsDtlsForoverride = [];
      newRows[index].batchesDtlsForoverride = [];
      newRows[index].daysDtlsForoverride = [];
      newRows[index].slotsDtlsForoverride = [];
      setOverrideDtls(newRows);
      return;
    } else {
      // Teacher selected → reset only dependent selected values
      newRows[index].teacherIdDtlsForoverride = value;
      newRows[index].subjectDtlsForoverride = {};
      newRows[index].batchDtlsForoverride = "";
      newRows[index].dayDtlsForoverride = "";
      newRows[index].slotDtlsForoverride = "";

      // Fetch subjects for this teacher
      const res = await axios.post(`${BASE}/teachers/getSubjectsByteacher`, { teacherId: value });
      newRows[index].subjectsDtlsForoverride = res.data;

      // Get days from teacher availability
      const daysArray = teacherAvailabilityDtls.filter(t => t.teacherDtls.teacherId == value).flatMap(t => Object.keys(t.availability));
      newRows[index].daysDtlsForoverride = [...new Set(daysArray)];

      // Leave batches & slots arrays empty until subject/day is selected
      newRows[index].batchesDtlsForoverride = [];
      newRows[index].slotsDtlsForoverride = [];
    }
    setOverrideDtls(newRows);
  };

  const handleBatchChangeOverrideRows = async (index, value) => {
    let newRows = [...overrideDtls];
    newRows[index].batchDtlsForoverride = value;
    setOverrideDtls(newRows);
  }


  const handleSubjectsByteacherChangeOverrideRows = async (index, value) => {
    if (value !== "") {
      const [subjectId, teacherId, grade, medium] = value.split("_");
      const subjectDtlsObj = {
        subjectId: subjectId,
        teacherId: teacherId,
        grade: grade,
        medium: medium
      };
      const subjectIds = subjectWeeklySlotDtls.map(row => row.subjectDtlsForWeeklySlot.subjectId).filter(id => id !== "");

      let newRows = [...overrideDtls];
      newRows[index].subjectDtlsForoverride = subjectDtlsObj;
      try {
        const res = await axios.post(`${BASE}/batches/getBatchesByGradeMediumAndSubjectIds`, {
          grade: subjectDtlsObj.grade,
          medium: subjectDtlsObj.medium,
          subjectIds: subjectIds
        });
        newRows[index].batchesDtlsForoverride = res.data;
        setOverrideDtls(newRows);
      } catch (error) {
        console.error("Error fetching batches:", error);
      }
    } else {
      let newRows = [...overrideDtls];
      newRows[index].subjectDtlsForoverride = {};
    }

  };


  const handleDayChangeOverrideRows = (index, value) => {
    if (value != "") {
      let newRows = [...overrideDtls];
      newRows[index].dayDtlsForoverride = value;
      const teacherId = newRows[index].teacherIdDtlsForoverride;
      const slots = teacherAvailabilityDtls.filter(t => t.teacherDtls.teacherId == teacherId).flatMap(t => t.availability?.[value] || []);
      newRows[index].slotDtlsForoverride = "";
      newRows[index].slotsDtlsForoverride = [...new Set(slots)];
      setOverrideDtls(newRows);
    } else {
      let newRows = [...overrideDtls];
      newRows[index].dayDtlsForoverride = "";
      newRows[index].slotDtlsForoverride = "";
      newRows[index].slotsDtlsForoverride = [];
      setOverrideDtls(newRows);
    }
  };


  const handleSlotChangeOverrideRows = (index, value) => {
    let newRows = [...overrideDtls];
    newRows[index].slotDtlsForoverride = value;
    setOverrideDtls(newRows);
  };




  // ---------- 1. VALIDATION ----------
  const validateTimetableDetails = () => {
    // Slots by Day
    for (let i = 0; i < slotDaysDtls.length; i++) {
      const row = slotDaysDtls[i];
      if (!row.slot) {
        alert(`Please select a slot for row ${i + 1} in Slots By Day`);
        return false;
      }
      if (!row.days || row.days.length === 0) {
        alert(`Please select at least one day for slot ${row.slot}`);
        return false;
      }
    }

    // Subjects Weekly Slots
    for (let i = 0; i < subjectWeeklySlotDtls.length; i++) {
      const row = subjectWeeklySlotDtls[i];
      if (!row.subjectDtlsForWeeklySlot?.subjectId) {
        alert(`Please select a subject for row ${i + 1} in Subjects Weekly Slots`);
        return false;
      }
      if (!row.weeklySlot) {
        alert(`Please select a weekly slot for subject row ${i + 1}`);
        return false;
      }
    }

    // Teacher Availability
    for (let i = 0; i < teacherAvailabilityDtls.length; i++) {
      const row = teacherAvailabilityDtls[i];
      if (!row.teacherDtls?.teacherId) {
        alert(`Please select a teacher for row ${i + 1} in Teacher Availability`);
        return false;
      }
    }

    return true; // All validations passed
  };

  // ---------- 2. PREPARATION ----------





  // ---------- 2. PREPARATION ----------
  const prepareTimetablePayload = async () => {
    try {
      const slots_by_day = days.reduce((acc, day) => {
        acc[day] = [];
        return acc;
      }, {});

      slotDaysDtls.forEach(row => {
        row.days.forEach(day => {
          if (row.slot) {
            slots_by_day[day].push("Slot-" + row.slot);
          }
        });
      });

      let subjects_by_grade = {};
      let weekly_periods = {};
      let grades = [];

      subjectWeeklySlotDtls.forEach(row => {
        let subjectId = row.subjectDtlsForWeeklySlot.subjectId;
        let gradeId = row.subjectDtlsForWeeklySlot.grade;

        let sub = subjects.find(s => s.subject_id == subjectId && s.grade == gradeId);
        if (!sub) return;

        let grade = sub.grade;
        let subject = sub.subject_name;
        grades.push(grade);

        if (!subjects_by_grade[grade]) subjects_by_grade[grade] = [];
        if (!subjects_by_grade[grade].includes(subject))
          subjects_by_grade[grade].push(subject);

        if (!weekly_periods[grade]) weekly_periods[grade] = {};
        weekly_periods[grade][subject] = row.weeklySlot;
      });

      grades = [...new Set(grades)];

      /* ---------- GET BATCHES ---------- */
      const batchRes = await axios.post(`${BASE}/batches/byGrades`, { grades });
      const batches = batchRes.data;

      /* ---------- GET CAN TEACH ---------- */
      const teacherIds = teacherAvailabilityDtls
        .map(t => t.teacherDtls.teacherId)
        .filter(t => t !== "");

      const canTeachRes = await axios.post(`${BASE}/teachers/canTeachByIds`, { teacherIds });
      const canTeachMap = {};
      canTeachRes.data.forEach(row => {
        if (!canTeachMap[row.teacher_id]) canTeachMap[row.teacher_id] = [];
        canTeachMap[row.teacher_id].push({
          grade: row.grade,
          subject: row.subject,
          medium: row.medium
        });
      });

      /* ---------- FINAL TEACHERS ---------- */
      const teachersFinal = teacherAvailabilityDtls.filter(row => row.teacherDtls).map(row => ({
        id: String(row.teacherDtls.teacherId),
        name: row.teacherDtls.teacherName,
        can_teach: canTeachMap[row.teacherDtls.teacherId] || [],
        availability: row.availability
      }));

      /* ---------- OVERRIDES PAYLOAD ---------- */
      const buildOverridesPayload = () => {
        return overrideDtls.reduce(
          (acc, row) => {
            if (!row.teacherIdDtlsForoverride) return acc;

            const hasAllDetails =
              row.subjectDtlsForoverride &&
              row.batchDtlsForoverride &&
              row.dayDtlsForoverride &&
              row.slotDtlsForoverride;

            if (hasAllDetails) {
              const subjectId = row.subjectDtlsForoverride.subjectId;
              const subjectObj = row.subjectsDtlsForoverride?.find(s => s.subject_id == subjectId);
              const subjectName = subjectObj ? subjectObj.subject : subjectId;

              acc.fixed_classes.push({
                teacher_id: row.teacherIdDtlsForoverride,
                batch_id: row.batchDtlsForoverride,
                subject: subjectName,
                day: row.dayDtlsForoverride,
                slot: row.slotDtlsForoverride
              });
            } else {
              let subjectName = "";
              if (row.subjectDtlsForoverride?.subjectId) {
                const subjectObj = row.subjectsDtlsForoverride?.find(
                  s => s.subject_id == row.subjectDtlsForoverride.subjectId
                );
                subjectName = subjectObj ? subjectObj.subject : row.subjectDtlsForoverride.subjectId;
              }

              acc.fixed_teacher.push({
                teacher_id: row.teacherIdDtlsForoverride,
                batch_id: row.batchDtlsForoverride || "",
                subject: subjectName
              });
            }

            return acc;
          },
          { fixed_teacher: [], fixed_classes: [] }
        );
      };

      /* ---------- FINAL JSON ---------- */
      const finalJSON = {
        days,
        slots_by_day,
        batches,
        subjects_by_grade,
        weekly_periods,
        teachers: teachersFinal,
        overrides: buildOverridesPayload() // call function to get data
      };

      return finalJSON; // ✅ RETURN the payload

    } catch (error) {
      alert("Something went wrong ❌");
      console.error(error);
    }
  };

  const handleGenerate = async () => {
    try {
      const finalJSON = await prepareTimetablePayload();
      console.log(JSON.stringify(finalJSON))
      const response = await fetch(`${BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalJSON)
      });
      alert("11")
      if (!response.ok) {
        alert("22") // check for non-2xx status
        alert(`Server responded with status ${response.status}`);
      }
      const data = await response.json();
      console.log("Backend Response:", data);
      if (data.type === "report") {
        setReportContent(data.data);
        setShowReportModal(true);
      } else if (data.type === "timetable") {
        setShowGenratedTimeTableData(true)
        setGenratedTimeTableData(data.data);
      }
    } catch (error) {
      alert("Something went wrong ❌");
      console.error(error);
    }
  };


  const handleConfirmSaveDraft = async () => {
  if (!userName) {
    alert("Please enter User Name");
    return;
  }

  const draft = getDraftData();
  try {
    await axios.post(`${BASE}/timeTable/saveConfigurationDraftFile`, {
      userName,
      fileContent: JSON.stringify(draft)
    });

    alert("Draft Saved Successfully ✅");
    setShowSaveModal(false);

  } catch (err) {
    console.error(err);
    alert("Error saving draft ❌");
  }
};

const getDraftData = () => {
  return {
    step,
    visibleTables,
    slotDaysDtls,
    subjectWeeklySlotDtls,
    teacherAvailabilityDtls,
    overrideDtls
  };
};

  /* ---------- UI ---------- */
  return (
    <>
      {!showGenratedTimeTableData && (
        <div className={classes.container}>
          <h2 className={classes.title}> Timetable Dashboard</h2>
         
          <button onClick={() => setShowSaveModal(true)}>
          💾 Save Draft
        </button>
          {step === 1 && (
            <div className={classes.card}>
              <div className={classes.tableTag}>Slots By Day</div>

              {visibleTables.slots && (
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <th>Slot</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      {days.map((day) => (
                        <th key={`slotDaysDtlsHead_${day}`}>{day}</th>
                      ))}
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {slotDaysDtls.map((slotDaysRow, index) => (
                      <tr key={`slotDaysRow_${index}`}>

                        <td>
                          <input
                            type="text"
                            value={slotDaysRow.slot}
                            readOnly
                            className={classes.select}
                          />
                        </td>

                        <td>
                          <input
                            type="time"
                            value={slotDaysRow.startTime || ""}
                            onChange={(e) =>
                              handleTimeChange(index, "startTime", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="time"
                            value={slotDaysRow.endTime || ""}
                            onChange={(e) =>
                              handleTimeChange(index, "endTime", e.target.value)
                            }
                          />
                        </td>

                        {days.map((day) => (
                          <td key={`slotDay_${index}_${day}`} className={classes.checkboxCell}>
                            <input
                              type="checkbox"
                              checked={slotDaysRow.days.includes(day)}
                              onChange={() => handleDayChange(index, day)}
                              className={classes.checkbox}
                            />
                          </td>
                        ))}

                        <td>
                          <FaMinusCircle
                            className={classes.deleteIcon}
                            onClick={() => removeSlotDayDtls(index)}
                          />
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <button className={classes.addButton} onClick={addSlotDaysDtls}>
                + Add Slot
              </button>

              <div className={classes.navButtons}>
              {/* Left Corner Placeholder */}
              <div /> 
  
              {/* Right Corner Button (Small & Professional) */}
              <button className={classes.nextBtn} onClick={nextStep}>
                Next: Subjects →
              </button>
          </div>


            </div>
            
          )}

          {/* SUBJECT TABLE */}

          {step === 2 && (

            <div className={classes.card}>
              <div className={classes.tableTag}>Subjects Weekly Slots</div>

      {visibleTables.subjects && (
  <table className={classes.table}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Weekly Slot</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectWeeklySlotDtls.map((subjectWeeklySlotObj, index) => (
                    <tr key={`subjectWeeklySlotRow_${index}`}>
                      <td>
                        <select value={
                          subjectWeeklySlotObj.subjectDtlsForWeeklySlot && subjectWeeklySlotObj.subjectDtlsForWeeklySlot.subjectId
                            ? `${subjectWeeklySlotObj.subjectDtlsForWeeklySlot.subjectId}_${subjectWeeklySlotObj.subjectDtlsForWeeklySlot.grade}`
                            : ""
                        }
                          onChange={(e) => handleSubjectChange(index, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {subjects.map((sub) => (
                            <option key={`subject_${index}_${sub.subject_id}`} value={`${sub.subject_id}_${sub.grade}`}>{sub.subject_name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={subjectWeeklySlotObj.weeklySlot} onChange={(e) => handleWeeklySlotChange(index, e.target.value)} className={classes.select}>
                          <option value="">Slots</option>
                          {weeklySlots.map((s) =>
                            (<option key={`weeklySlot_${index}_${s}`} value={s}>{s}</option>)
                          )}
                        </select>
                      </td>
                      <td>
                        <FaMinusCircle className={classes.deleteIcon} onClick={() => removeSubjectWeeklySlotDtls(index)} />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
)}

              <button className={classes.addButton} onClick={addSubjectWeeklySlotDtls}>
                + Add Subject
              </button>

              <div className={classes.navButtons}>
                <button className={classes.prevBtn} onClick={prevStep}>← Previous Step</button>
                <button className={classes.nextBtn} onClick={nextStep}>Next Step →</button>
              </div>
            </div>
          )}


          {/* TEACHER TABLE */}
          {step === 3 && (
            <div className={classes.card}>
              <div className={classes.tableTag}>Teacher Availability</div>
              {visibleTables.teachers && (
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    {days.map((day) => (<th key={day}>{day}</th>))}
                    <th >Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherAvailabilityDtls.map((teacherAvailabilityObj, rowIndex) => (
                    <tr key={`teacherAvailabilityRow_${rowIndex}`}>
                      <td>
                        <select key={`teacherAvailabilityTeacher_${rowIndex}`} value={teacherAvailabilityObj.teacherId} onChange={(e) => handleTeacherChange(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {teacherAvailabilityObj.teachersBySubjects.map((t) => (
                            <option key={`teacherAvailabilityTeacher_${rowIndex}_${t.teacher_id}`} value={t.teacher_id}>{t.teacher_name}</option>
                          ))}
                        </select>
                      </td>
                      {days.map((day) => (
                        <td key={day} className={classes.checkboxCell}>
                          {slotDaysDtls.filter((r) => r.days.includes(day)).length > 0
                            ? slotDaysDtls.filter((r) => r.days.includes(day)).map((r) => {
                              const slot =  r.slot;
                              return (
                                <label key={slot} className={classes.checkboxLabel}>
                                  <input type="checkbox" onChange={() => handleAvailabilityChange(rowIndex, day, slot)} className={classes.checkbox} />{slot}
                                </label>
                              );
                            })
                            : "-"}
                        </td>
                      ))}
                      <td>
                        <FaMinusCircle className={classes.deleteIcon} onClick={() => removeTeacherAvailabilityDtls(rowIndex)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
              <button className={classes.addButton} onClick={addTeacherAvailabilityDtls}> + Add Teacher </button>
              <div>
                <div className={classes.navButtons}>
                  <button className={classes.prevBtn} onClick={prevStep}>← Prev</button>
                  <button className={classes.nextBtn} onClick={nextStep}>Next Step →</button>
                </div>
              </div>
            </div>
          )}


          {/* ---------- OVERRIDE TABLE ---------- */}

          {step === 4 && (
            <div className={classes.card}>
              <div className={classes.tableTag}>Overrides</div>
              {visibleTables.overrides && (
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Batch</th>
                    <th>Day</th>
                    <th>Slot</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>

                  {overrideDtls.map((overrideObj, rowIndex) => (
                    <tr key={`overrideRow_${rowIndex}`}>
                      {/* Teacher */}
                      <td>
                        <select value={overrideObj.teacherIdDtlsForoverride || ""} onChange={(e) => handleTeacherChangeOverrideRows(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {overrideObj.selectedTecaherDtlsDtlsForoverride.map(t => (
                            <option key={`overridesTeacher_${rowIndex}_${t.teacherId}`} value={t.teacherId}>{t.teacherName}</option>
                          ))}
                        </select>
                      </td>
                      {/* Subject */}
                      <td>
                        <select value={`${overrideObj.subjectDtlsForoverride?.subjectId || ""}_${overrideObj.subjectDtlsForoverride?.teacherId || ""}_${overrideObj.subjectDtlsForoverride?.grade || ""}_${overrideObj.subjectDtlsForoverride?.medium || ""}`}
                          onChange={(e) => handleSubjectsByteacherChangeOverrideRows(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {overrideObj.subjectsDtlsForoverride.map((sub) => (
                            <option key={`overridesSubject_${rowIndex}_${sub.subject_id}_${sub.teacher_id}_${sub.grade}_${sub.medium}`}
                              value={`${sub.subject_id}_${sub.teacher_id}_${sub.grade}_${sub.medium}`}>{sub.subject}_{sub.medium}</option>
                          ))}
                        </select>
                      </td>
                      {/* Batch */}
                      <td>
                        <select value={overrideObj.batchDtlsForoverride || ""} onChange={(e) => handleBatchChangeOverrideRows(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {overrideObj.batchesDtlsForoverride.map(b => (<option key={`overridesBatch_${rowIndex}_${b.id}`} value={b.id}>{b.id}
                          </option>))}
                        </select>
                      </td>


                      {/* Day */}
                      <td>
                        <select value={overrideObj.dayDtlsForoverride || ""} onChange={(e) => handleDayChangeOverrideRows(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {overrideObj.daysDtlsForoverride.map(day => (<option key={`overridesDay_${rowIndex}_${day}`} value={day}>{day}</option>))}
                        </select>
                      </td>

                      {/* Slot */}
                      <td>
                        <select value={overrideObj.slotDtlsForoverride || ""} onChange={(e) => handleSlotChangeOverrideRows(rowIndex, e.target.value)} className={classes.select}>
                          <option value="">Select</option>
                          {overrideObj.slotsDtlsForoverride.map(slot => (<option key={`overridesDay_${rowIndex}_${slot}`} value={slot}>{slot}</option>))}
                        </select>
                      </td>


                      {/* Remove */}
                      <td>
                        <FaMinusCircle
                          className={classes.deleteIcon}
                          onClick={() => removeOverrideDtls(rowIndex)}
                        />
                      </td>

                    </tr>

                  ))}

                </tbody>
              </table>
              )}
              <button
                className={classes.addButton}
                onClick={addOverrideDtls}
              >
                + Add Override
              </button>

              <div className={classes.navButtons}>
                <button className={classes.prevBtn} onClick={prevStep}>← Back to Teachers</button>
                <button className={classes.generateButton} onClick={handleGenerate}>🚀 Generate Timetable</button>
              </div>
            </div>
          )}


          {/* ACTION BUTTONS */}
          <div className={classes.actionButtons}>
            <button className={classes.generateButton} onClick={handleGenerate}>Generate Timetable</button>
            <button className={classes.clearButton}>Clear All</button>
          </div>
        </div>
      )}

      {showGenratedTimeTableData && (<TimeTableView timeTableData={genratedTimeTableData} />)}

      {showReportModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modalContent}>
            <h2>Timetable Report</h2>
            <pre className={classes.modalReport}>{reportContent}</pre>
            <button className={classes.modalCloseButton} onClick={() => setShowReportModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modalContent}>
            <h3>Save Draft</h3>

            <div className={classes.formGroup}>
              <label>User Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className={classes.modalActions}>
              <button className={classes.saveButton} onClick={handleConfirmSaveDraft}>
                Save
              </button>
              <button className={classes.clearButton} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>

  )
};