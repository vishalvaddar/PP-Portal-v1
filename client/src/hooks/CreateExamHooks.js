import { useState, useEffect } from "react";
import axios from "axios";

const useCreateExamHooks = () => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [assignedApplicants, setAssignedApplicants] = useState([]);
  const [centres, setCentres] = useState([]);
  const [newCentreName, setNewCentreName] = useState("");
  const [examBlocks, setExamBlocks] = useState({});
  
  const [formData, setFormData] = useState({
    centreId: "",
    examName: "",
    examDate: "",
    district: "",
    blocks: [],
    app_state: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams`);
        // console.log('Exam API Response:', response.data);
        //  console.log("log data:",formData.blocks);
        console.log("the raw things in e entry ",entries);
        if (response.data && Array.isArray(response.data)) {
          const formattedEntries = response.data.map(exam => {
            // Handle both snake_case and camelCase formats
            const formattedExam = {
              exam_id: exam.exam_id || exam.examId,
              exam_name: exam.exam_name || exam.examName,
              exam_date: exam.exam_date || exam.examDate,
              pp_exam_centre_id: exam.pp_exam_centre_id || exam.centreId,
              pp_exam_centre_name: exam.pp_exam_centre_name,
              district: exam.district_ids ? exam.district_ids[0] : null,
              district_name: exam.district_names ? exam.district_names[0] : null,
              blocks: exam.block_ids ? exam.block_ids.map((id, index) => ({
                id: id,
                name: exam.block_names[index]
              })) : [],
              frozen_yn: exam.frozen_yn || 'N'
            };
            // console.log('Formatted Exam:', formattedExam);
            return formattedExam;
          });
          // console.log('All Formatted Entries:', formattedEntries);
          setEntries(formattedEntries);
          // Fetch districts and blocks for each exam
          await Promise.all(formattedEntries.map(async (exam) => {
            if (exam.district && exam.district !== ':district') {
              try {
                const blocksResponse = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/blocks-by-district/${exam.district}`);
                setExamBlocks(prev => ({
                  ...prev,
                  [exam.district]: blocksResponse.data
                }));
              } catch (blockError) {
                console.error(`Error fetching blocks for district ${exam.district}:`, blockError);
              }
            }
          }));
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

  //fetch the centres done
  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/exam-centres`);
        setCentres(response.data);
      } catch (error) {
        console.error("Error fetching centres:", error);
      }
    };
    fetchCentres();
  }, []);

  //get the district done
  useEffect(() => {
    if (!formData.app_state) return;
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/districts-by-state/${formData.app_state}`);
        setDistricts(response.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [formData.app_state]);

  
  //fetch the blocks
useEffect(() => {
  const fetchBlocks = async () => {
    if (!formData.district) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/blocks-by-district/${formData.district}`);
      setBlocks(response.data);
      
    } catch (error) {
      console.error("Error fetching blocks:", error);
    }
  };
  fetchBlocks();
}, [formData.district]);


  const [usedBlocks, setUsedBlocks] = useState([]);
  //used-blocks done
  useEffect(() => {
    const fetchUsedBlocks = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/used-blocks`);
        setUsedBlocks(response.data);
      } catch (error) {
        console.error("Error fetching used blocks:", error);
      }
    };
    fetchUsedBlocks();
  }, []);

  const handleBlockCheckboxChange = (blockId) => {
  setFormData((prev) => {
    const newBlocks = prev.blocks.includes(blockId)
      ? prev.blocks.filter((id) => id !== blockId)
      : [...prev.blocks, blockId];

    // Log the new blocks array
    // console.log("Updated blocks array:", newBlocks);
   
    

    return { ...prev, blocks: newBlocks };
  });
};


  //main submit button
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    

    try {
      const payload = {
        centreId: formData.centreId,
        Exam_name: formData.examName,
        date: formData.examDate,
        district: formData.district,
        blocks: formData.blocks,
      };

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/create`, payload);

      // Fetch updated exam list after creation
      const updatedExamsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams`);
      setEntries(updatedExamsResponse.data);
       
       
      
     
      setFormData({
        centreId: "",
        examName: "",
        examDate: "",
        district: "",
        blocks: [],
        app_state: formData.app_state,
      });
      setShowForm(false);
      setMessage("✅ Exam Created and Students Assigned Successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      
      if (error.response) {
        if (error.response.status === 400) {
          setMessage(`❌ ${error.response.data.error || "Missing required fields"}`);
        } else if (error.response.status === 404) {
          setMessage(`❌ ${error.response.data.message || "No applicants found for selected blocks"}`);
        } else if (error.response.status === 409) {
          setMessage(`❌ ${error.response.data.message || "Conflict with existing data"}`);
        } else {
          setMessage(`❌ Server error: ${error.response.data.message || "Unknown error"}`);
        }
      } else if (error.request) {
        setMessage("❌ No response from server. Check your connection.");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
     //delete centre done
  const deleteExam = async (examId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/${examId}`);
      // Fetch updated exam list after deletion
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams`);
      setEntries(response.data);
      setMessage("✅ Exam deleted successfully");
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setMessage("❌ Failed to delete exam");
    }
  };
  
  //create centre done
  const createCentre = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/exam-centres`, {
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
  //delete the centre done
  const deleteCentre = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/exam-centres/${id}`);
      setCentres(centres.filter((c) => c.pp_exam_centre_id !== id));
      if (formData.centreId === id) {
        setFormData({ ...formData, centreId: "" });
      }
      setMessage("✅ Centre deleted");
    } catch (err) {
      console.error("Delete centre error:", err);
      setMessage("❌ Failed to delete centre");
    }
  };
   ///done
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


const toggleFreezeExam = async (examId) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/exams/${examId}/freeze`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to freeze exam');
    }

    // Update local state to reflect frozen
    setEntries(prev =>
      prev.map(entry =>
        entry.exam_id === examId
          ? { ...entry, frozen_yn: 'Y' }
          : entry
      )
    );
  } catch (error) {
    console.error('Freeze error:', error);
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
    toggleFreezeExam
  };
};

export default useCreateExamHooks;
