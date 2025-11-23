// src/hooks/EvalutionHooks.js
import { useEffect ,useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const useResultandrankHooks = () =>{


   const [divisions, setDivisions] = useState([]);
   const [educationDistricts, setEducationDistricts] = useState([]);
   const [blocks,setBlocks] = useState([]);
   const [searchResults, setSearchResults] = useState([]);

   const [formData, setFormData] = useState({
    division: "",
    education_district: "",
    block: "",
    cluster: "",
    app_state: 1,
   })

   

  useEffect(() => {
  if (!formData.app_state) return;

  const fetchDivisions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/exams/divisions-by-state/${formData.app_state}`
      );
      setDivisions(response.data);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

    fetchDivisions();
  }, [formData.app_state]);


  useEffect(() => {
  if (!formData.division) return;

  const fetchEducationDistricts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/exams/education-districts-by-division/${formData.division}`
      );
      setEducationDistricts(response.data);
    } catch (error) {
      console.error("Error fetching education districts:", error);
    }
  };

  fetchEducationDistricts();
}, [formData.division]);

useEffect (() =>{
  if(!formData.education_district) return ;

  const fetchBlocks = async() =>{
    try {
      const response = await axios.get(`${API_BASE_URL}/api/exams/blocks-by-district/${formData.education_district}`);
      setBlocks(response.data);
    } catch (error) {
       console.error("Error fetching blocks:", error);
    }
  }
  fetchBlocks();
},[formData.education_district, setBlocks]);

//  const handleSearch = async () => {
//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_BACKEND_API_URL}/api/results/search`,
//         formData
//       );
//       setSearchResults(response.data);
//     } catch (error) {
//       console.error("Error fetching results:", error);
//     }
//   };

const handleSearch = async () => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/results/search`,
      formData
    );
    console.log("Search Results Response:", response.data); // ✅ Add this
    setSearchResults(response.data);
  } catch (error) {
    console.error("Error fetching results:", error);
  }
};


const handleDownload = async () => {
  if (!formData.blocks || formData.blocks.length === 0) {
    alert("Please select at least one block");
    return;
  }

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/results/download-results`,
      { 
        division: formData.division,
        district: formData.education_district,
        blocks: formData.blocks
      },
      { 
        responseType: "blob",
        observeHeaders: true
      }
    );

    // Read file name from server header
    let fileName = "results.xlsx";
    const header = response.headers["content-disposition"];
    if (header && header.includes("filename=")) {
      fileName = header.split("filename=")[1].replace(/"/g, "");
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    alert("Error downloading file");
  }
};




 

return {
 formData,
  divisions,
    setFormData,
    educationDistricts,
    blocks,
     handleSearch,
  searchResults,
  handleDownload
  
}

}

export default useResultandrankHooks;