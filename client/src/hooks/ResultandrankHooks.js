// src/hooks/EvalutionHooks.js
import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

// Fetch States
export function useFetchStates(setStates) {
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/states`);
        setStates(response.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []); // ✅ no need to depend on setStates (it's stable)
}

// Fetch Districts (based on stateId)
export function useFetchDistricts(stateId, setDistricts) {
  useEffect(() => {
    const fetchDistricts = async () => {
      if (stateId) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/districts-by-state/${stateId}`
          );
          setDistricts(response.data);
        } catch (error) {
          console.error("Error fetching districts:", error);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [stateId]); // ✅ only depends on stateId
}

// Fetch Blocks (based on districtId)
export function useFetchBlocks(districtId, setBlocks) {
  useEffect(() => {
    const fetchBlocks = async () => {
      if (districtId) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/blocks-by-district/${districtId}`
          );
          setBlocks(response.data);
        } catch (error) {
          console.error("Error fetching blocks:", error);
        }
      } else {
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [districtId]); // ✅ only depends on districtId
}
