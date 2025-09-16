import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const useEvaluationModule = () => {
  const [examNames, setExamNames] = useState([]);
  const [responseData, setResponseData] = useState(null);
  const [selectedExam, setSelectedExam] = useState("");

  useEffect(() => {
    const fetchExamName = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/evaluation/exam_names`);
        setExamNames(response.data.message || []);
      } catch (error) {
        console.error("Failed to fetch exam name:", error);
      }
    };

    fetchExamName();
  }, []);

  useEffect(() => {
    const sendSelectedExam = async () => {
      if (selectedExam) {
        try {
          const res = await axios.post(`${API_BASE_URL}/evaluation/exam_query`, {
            exam_name: selectedExam,
          });
          setResponseData(res.data);
        } catch (error) {
          console.error("Failed to fetch query data:", error);
        }
      }
    };
    sendSelectedExam();
  }, [selectedExam]);

  const downloadExcel = async () => {
    if (!selectedExam) return;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/evaluation/download_excel`,
        { exam_name: selectedExam },
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_${selectedExam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download Excel:", error);
      throw error;
    }
  };

  const uploadBulkData = async (file) => {
    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/evaluation/bulk-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );
      
      console.log("Upload successful:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response && error.response.data instanceof Blob) {
        const blob = new Blob([error.response.data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "upload_errors.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        throw new Error("Upload failed. Please check the error file for details.");
      } else {
        throw new Error("Upload failed: " + (error.message || "Unknown error"));
      }
    }
  };

  return {
    examNames,
    responseData,
    selectedExam,
    setSelectedExam,
    downloadExcel,
    uploadBulkData,
  };
};

export default useEvaluationModule;
