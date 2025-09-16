import { useState, useEffect } from "react";
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const useCreateExamHooks = () => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [assignedApplicants] = useState([]);
  const [centres, setCentres] = useState([]);
  const [newCentreName, setNewCentreName] = useState("");
  const [examBlocks, setExamBlocks] = useState({});
  
  const [formData, setFormData] = useState({
    centreId: "",
    examName: "",
    examDate: "",
    app_state: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all exams student assigned when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exams/assigned`);
        if (response.data && Array.isArray(response.data)) {
          const formattedEntries = response.data.map(exam => {
            return {
              exam_id: exam.exam_id || exam.examId,
              exam_name: exam.exam_name || exam.examName,
              exam_date: exam.exam_date || exam.examDate,
              pp_exam_centre_id: exam.pp_exam_centre_id || exam.centreId,
              pp_exam_centre_name: exam.pp_exam_centre_name,
              district: exam.district_ids ? exam.district_ids[0] : null,
              district_name: exam.district_names ? exam.district_names[0] : null,
              blocks: exam.block_ids
                ? exam.block_ids.map((id, index) => ({
                    id: id,
                    name: exam.block_names[index],
                  }))
                : [],
              frozen_yn: exam.frozen_yn || "N",
            };
          });
          setEntries(formattedEntries);

          // Fetch districts and blocks for each exam
          await Promise.all(
            formattedEntries.map(async exam => {
              if (exam.district && exam.district !== ":district") {
                try {
                  const blocksResponse = await axios.get(
                    `${API_BASE_URL}/api/exams/blocks-by-district/${exam.district}`
                  );
                  setExamBlocks(prev => ({
                    ...prev,
                    [exam.district]: blocksResponse.data,
                  }));
                } catch (blockError) {
                  console.error(
                    `Error fetching blocks for district ${exam.district}:`,
                    blockError
                  );
                }
              }
            })
          );
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        setError("Failed to fetch exam data");
        setMessage("❌ Failed to fetch exams");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // fetch the centres
  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exams/exam-centres`);
        setCentres(response.data);
      } catch (error) {
        console.error("Error fetching centres:", error);
      }
    };
    fetchCentres();
  }, []);

  // get the districts
  useEffect(() => {
    if (!formData.app_state) return;
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/exams/districts-by-state/${formData.app_state}`
        );
        setDistricts(response.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [formData.app_state]);

  // fetch the blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!formData.district) return;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/exams/blocks-by-district/${formData.district}`
        );
        setBlocks(response.data);
      } catch (error) {
        console.error("Error fetching blocks:", error);
      }
    };
    fetchBlocks();
  }, [formData.district]);

  const [usedBlocks, setUsedBlocks] = useState([]);
  // used-blocks
  useEffect(() => {
    const fetchUsedBlocks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exams/used-blocks`);
        setUsedBlocks(response.data);
      } catch (error) {
        console.error("Error fetching used blocks:", error);
      }
    };
    fetchUsedBlocks();
  }, []);

  const handleBlockCheckboxChange = blockId => {
    setFormData(prev => {
      const newBlocks = prev.blocks.includes(blockId)
        ? prev.blocks.filter(id => id !== blockId)
        : [...prev.blocks, blockId];
      return { ...prev, blocks: newBlocks };
    });
  };

  // main submit button
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        centreId: formData.centreId,
        examName: formData.examName,
        date: formData.examDate,
      };
      console.log("Payload being sent to backend:", payload);

      await axios.post(`${API_BASE_URL}/api/exams/create`, payload);

      // Fetch updated exam list after creation
      const updatedExamsResponse = await axios.get(`${API_BASE_URL}/api/exams`);
      setEntries(updatedExamsResponse.data);

      setFormData({
        centreId: "",
        examName: "",
        examDate: "",
        app_state: formData.app_state,
      });
      setShowForm(false);
      setMessage("✅ Exam Created Successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response) {
        setMessage(`❌ ${error.response.data.error || "Missing required fields"}`);
      } else if (error.request) {
        setMessage("❌ No response from server. Check your connection.");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // delete exam
  const deleteExam = async examId => {
    try {
      await axios.delete(`${API_BASE_URL}/api/exams/${examId}`);
      const response = await axios.get(`${API_BASE_URL}/api/exams`);
      setEntries(response.data);
      setMessage("✅ Exam deleted successfully");
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setMessage("❌ Failed to delete exam");
    }
  };

  // create centre
  const createCentre = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/exams/exam-centres`, {
        pp_exam_centre_name: newCentreName,
      });
      setCentres([...centres, res.data]);
      setNewCentreName("");
      setMessage("✅ Centre created successfully");
    } catch (err) {
      console.error("Create centre error:", err);
      setMessage("❌ Failed to create centre");
    }
  };

  // delete centre
  const deleteCentre = async id => {
    try {
      await axios.delete(`${API_BASE_URL}/api/exams/exam-centres/${id}`);
      setCentres(centres.filter(c => c.pp_exam_centre_id !== id));
      if (formData.centreId === id) {
        setFormData({ ...formData, centreId: "" });
      }
      setMessage("✅ Centre deleted");
    } catch (err) {
      console.error("Delete centre error:", err);
      setMessage("❌ Failed to delete centre");
    }
  };

  // handle input change
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFreezeExam = async examId => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/freeze`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to freeze exam");
      }

      setEntries(prev =>
        prev.map(entry =>
          entry.exam_id === examId ? { ...entry, frozen_yn: "Y" } : entry
        )
      );
    } catch (error) {
      console.error("Freeze error:", error);
    }
  };

  return {
    entries,
    setEntries,
    showForm,
    setShowForm,
    districts,
    blocks,
    loading,
    message,
    assignedApplicants,
    centres,
    newCentreName,
    setNewCentreName,
    formData,
    setFormData,
    handleChange,
    handleBlockCheckboxChange,
    handleSubmit,
    createCentre,
    deleteCentre,
    deleteExam,
    examBlocks,
    usedBlocks,
    isLoading,
    error,
    toggleFreezeExam,
  };
};

export default useCreateExamHooks;
