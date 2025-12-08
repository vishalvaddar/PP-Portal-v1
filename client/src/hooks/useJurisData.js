import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

// ------------------------- //
// Fetch States
// ------------------------- //
export function useFetchStates(setStates) {
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/states`);
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
      }
    };
    fetchStates();
  }, [setStates]);
}

// ------------------------- //
// Fetch Districts (via State → Division → District)
// ------------------------- //
export function useFetchEducationDistricts(stateId, setDistricts) {
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!stateId) {
        setDistricts([]);
        return;
      }

      try {
        const divisionsRes = await axios.get(
          `${API_BASE_URL}/api/divisions-by-state/${stateId}`
        );
        const divisions = Array.isArray(divisionsRes.data)
          ? divisionsRes.data
          : divisionsRes.data.data || [];

        let allDistricts = [];

        for (const division of divisions) {
          const distRes = await axios.get(
            `${API_BASE_URL}/api/districts-by-division/${division.id}`
          );
          const dists = Array.isArray(distRes.data)
            ? distRes.data
            : distRes.data.data || [];
          allDistricts = [...allDistricts, ...dists];
        }

        setDistricts(allDistricts);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [stateId, setDistricts]);
}

// ------------------------- //
// Fetch Blocks (via District → Block)
// ------------------------- //
export function useFetchBlocks(districtId, setBlocks) {
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!districtId) {
        setBlocks([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/blocks-by-district/${districtId}`
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        setBlocks(data);
      } catch (error) {
        console.error("Error fetching blocks:", error);
        setBlocks([]);
      }
    };

    fetchBlocks();
  }, [districtId, setBlocks]);
}

// ------------------------- //
// Fetch Institutes (via Block → Cluster → Institute)
// ------------------------- //
export function useFetchInstitutes(blockId, setInstitutes) {
  useEffect(() => {
    const fetchInstitutes = async () => {
      if (!blockId) {
        setInstitutes([]);
        return;
      }

      try {
        const clustersRes = await axios.get(
          `${API_BASE_URL}/api/clusters-by-block/${blockId}`
        );
        const clusters = Array.isArray(clustersRes.data)
          ? clustersRes.data
          : clustersRes.data.data || [];

        let allInstitutes = [];

        for (const cluster of clusters) {
          const instRes = await axios.get(
            `${API_BASE_URL}/api/institutes-by-cluster/${cluster.id}`
          );
          const institutes = Array.isArray(instRes.data)
            ? instRes.data
            : instRes.data.data || [];
          allInstitutes = [...allInstitutes, ...institutes];
        }

        setInstitutes(allInstitutes);
      } catch (error) {
        console.error("Error fetching institutes:", error);
        setInstitutes([]);
      }
    };

    fetchInstitutes();
  }, [blockId, setInstitutes]);
}
