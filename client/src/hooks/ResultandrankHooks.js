import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const useResultandrankHooks = () => {
  const [divisions, setDivisions] = useState([]);
  const [educationDistricts, setEducationDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    ppExamCleared: "all",
    interviewStatus: "all",
    interviewResult: "all",
    verificationStatus: "all"
  });

  const [formData, setFormData] = useState({
    searchType: "blocks",
    division: "",
    education_district: "",
    blocks: [],
    exam_id: "",
    app_state: 1,
  });

  // Fetch divisions
  useEffect(() => {
    if (!formData.app_state) return;

    const fetchDivisions = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/exams/divisions-by-state/${formData.app_state}`
        );
        setDivisions(response.data);
      } catch (error) {
        console.error("Error fetching divisions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDivisions();
  }, [formData.app_state]);

  // Fetch education districts
  useEffect(() => {
    if (!formData.division) {
      setEducationDistricts([]);
      setBlocks([]);
      return;
    }

    const fetchEducationDistricts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/exams/education-districts-by-division/${formData.division}`
        );
        setEducationDistricts(response.data);
        setBlocks([]);
      } catch (error) {
        console.error("Error fetching education districts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEducationDistricts();
  }, [formData.division]);

  // Fetch blocks
  useEffect(() => {
    if (!formData.education_district) {
      setBlocks([]);
      return;
    }

    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/exams/blocks-by-district/${formData.education_district}`
        );
        setBlocks(response.data);
      } catch (error) {
        console.error("Error fetching blocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [formData.education_district]);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/results/all-exams`
        );
        setExams(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Apply filters
  useEffect(() => {
    if (searchResults.length === 0) {
      setFilteredResults([]);
      return;
    }

    const filtered = searchResults.filter(result => {
      if (filters.ppExamCleared !== "all") {
        const clearedValue = result.pp_exam_cleared || "N";
        if (filters.ppExamCleared === "Y" && clearedValue !== "Y") return false;
        if (filters.ppExamCleared === "N" && clearedValue !== "N") return false;
      }

      if (filters.interviewStatus !== "all") {
        const status = result.interview_status || "";
        if (filters.interviewStatus !== status) return false;
      }

      if (filters.interviewResult !== "all") {
        const resultValue = result.interview_result || "";
        if (filters.interviewResult !== resultValue) return false;
      }

      if (filters.verificationStatus !== "all") {
        const status = result.verification_status || "";
        if (filters.verificationStatus !== status) return false;
      }

      return true;
    });

    setFilteredResults(filtered);
  }, [searchResults, filters]);

  // Handle search
  const handleSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      let endpoint = "";
      let payload = {};

      if (formData.searchType === "blocks") {
        endpoint = "/api/results/search-by-blocks";
        payload = {
          division: formData.division || null,
          education_district: formData.education_district || null,
          blocks: formData.blocks.length > 0 ? formData.blocks : null,
          app_state: formData.app_state
        };
      } else {
        endpoint = "/api/results/search-by-exam";
        payload = {
          exam_id: formData.exam_id
        };
      }

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        payload,
        {
          timeout: 30000
        }
      );
      
      console.log("Search Results Response:", response.data);
      setSearchResults(response.data);

      // Reset filters
      setFilters({
        ppExamCleared: "all",
        interviewStatus: "all",
        interviewResult: "all",
        verificationStatus: "all"
      });
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("Error fetching results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Handle download
const handleDownload = async () => {
  try {
    setIsLoading(true);
    let endpoint = "";
    let payload = {};

    if (formData.searchType === "blocks") {
      endpoint = "/api/results/download-by-blocks";
      payload = {
        division: formData.division || null,
        district: formData.education_district || null,
        blocks: formData.blocks.length > 0 ? formData.blocks : null,
        app_state: formData.app_state
      };
    } else {
      endpoint = "/api/results/download-by-exam";
      payload = {
        exam_id: formData.exam_id
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,
      payload,
      {
        responseType: "blob",
        timeout: 60000
      }
    );

    // Generate dynamic filename based on search criteria
    let fileName = "results.xlsx";
    
    if (formData.searchType === "blocks") {
      if (formData.division && divisions.length > 0) {
        const divisionName = divisions.find(d => d.id == formData.division)?.name || "All_Divisions";
        
        if (formData.education_district && educationDistricts.length > 0) {
          const districtName = educationDistricts.find(d => d.id == formData.education_district)?.name || "All_Districts";
          
          if (formData.blocks.length > 0 && blocks.length > 0) {
            const blockNames = formData.blocks.map(blockId => {
              const block = blocks.find(b => b.id == blockId);
              return block?.name || blockId;
            });
            fileName = `results_${divisionName}_${districtName}_${blockNames.join('_')}.xlsx`;
          } else {
            fileName = `results_${divisionName}_${districtName}_all_blocks.xlsx`;
          }
        } else {
          fileName = `results_${divisionName}_all_districts_all_blocks.xlsx`;
        }
      } else {
        fileName = `results_all_divisions_all_districts_all_blocks.xlsx`;
      }
    } else {
      // For exam search
      if (formData.exam_id && exams.length > 0) {
        const exam = exams.find(e => e.exam_id == formData.exam_id);
        const examName = exam ? exam.exam_name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') : "Exam";
        fileName = `results_${examName}.xlsx`;
      } else {
        fileName = `results_all_exams.xlsx`;
      }
    }

    // Clean filename
    fileName = fileName.replace(/[^\w._-]/g, '_').replace(/_+/g, '_');

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    alert("Error downloading file. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (field) => {
    const values = searchResults
      .map(result => result[field] || "")
      .filter(value => value !== "");
    return ["all", ...new Set(values)];
  };

  return {
    formData,
    divisions,
    setFormData,
    educationDistricts,
    blocks,
    exams,
    handleSearch,
    searchResults: filteredResults,
    originalResults: searchResults,
    handleDownload,
    filters,
    handleFilterChange,
    getUniqueValues,
    totalResults: searchResults.length,
    filteredResultsCount: filteredResults.length,
    isLoading
  };
};

export default useResultandrankHooks;