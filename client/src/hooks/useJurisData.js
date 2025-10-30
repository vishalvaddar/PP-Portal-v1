import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

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
  }, [setStates]);
}

export function useFetchDivisions(stateId, setDivisions) {
  useEffect(() => {
    const fetchDivisions = async () => {
      if (stateId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/divisions-by-state/${stateId}`);
          setDivisions(response.data);
        } catch (error) {
          console.error("Error fetching divisions:", error);
        }
      } else {
        setDivisions([]);
      }
    };
    fetchDivisions();
  }, [stateId, setDivisions]);
}

export function useFetchEducationDistricts(divisionId, setDistricts) {
  useEffect(() => {
    const fetchDistricts = async () => {
      if (divisionId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/districts-by-division/${divisionId}`);
          setDistricts(response.data);
        } catch (error) {
          console.error("Error fetching districts:", error);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [divisionId, setDistricts]);
}

export function useFetchBlocks(districtId, setBlocks) {
  useEffect(() => {
    const fetchBlocks = async () => {
      if (districtId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/blocks-by-district/${districtId}`);
          setBlocks(response.data);
        } catch (error) {
          console.error("Error fetching blocks:", error);
        }
      } else {
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [districtId, setBlocks]);
}

export function useFetchInstitutes(blockId, setInstitutes) {
  useEffect(() => {
    const fetchInstitutes = async () => {
      if (blockId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/institutes-by-block/${blockId}`);
          setInstitutes(response.data);
        } catch (error) {
          console.error("Error fetching institutes:", error);
        }
      } else {
        setInstitutes([]);
      }
    };
    fetchInstitutes();
  }, [blockId, setInstitutes]);
}
