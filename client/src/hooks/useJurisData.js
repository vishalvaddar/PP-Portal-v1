import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

/* =========================================================
   Fetch States
========================================================= */
export function useFetchStates(setStates) {
  useEffect(() => {
    let isMounted = true;

    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/states`);
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        if (isMounted) setStates(data);
      } catch (err) {
        console.error("Error fetching states:", err);
        if (isMounted) setStates([]);
      }
    };

    fetchStates();
    return () => (isMounted = false);
  }, [setStates]);
}

/* =========================================================
   Fetch Districts (State → Division → District)
========================================================= */
export function useFetchEducationDistricts(stateId, setDistricts) {
  useEffect(() => {
    let isMounted = true;

    if (!stateId) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const divRes = await axios.get(
          `${API_BASE_URL}/api/divisions-by-state/${stateId}`
        );
        const divisions = Array.isArray(divRes.data)
          ? divRes.data
          : divRes.data.data || [];

        const districtRequests = divisions.map((d) =>
          axios.get(`${API_BASE_URL}/api/districts-by-division/${d.id}`)
        );

        const districtResponses = await Promise.all(districtRequests);

        const allDistricts = districtResponses.flatMap((res) =>
          Array.isArray(res.data) ? res.data : res.data.data || []
        );

        if (isMounted) setDistricts(allDistricts);
      } catch (err) {
        console.error("Error fetching districts:", err);
        if (isMounted) setDistricts([]);
      }
    };

    fetchDistricts();
    return () => (isMounted = false);
  }, [stateId, setDistricts]);
}

/* =========================================================
   Fetch Blocks (District → Block)
========================================================= */
export function useFetchBlocks(districtId, setBlocks) {
  useEffect(() => {
    let isMounted = true;

    if (!districtId) {
      setBlocks([]);
      return;
    }

    const fetchBlocks = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/blocks-by-district/${districtId}`
        );
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        if (isMounted) setBlocks(data);
      } catch (err) {
        console.error("Error fetching blocks:", err);
        if (isMounted) setBlocks([]);
      }
    };

    fetchBlocks();
    return () => (isMounted = false);
  }, [districtId, setBlocks]);
}

/* =========================================================
   Fetch Institutes (Block → Cluster → Institute)
========================================================= */
export function useFetchInstitutes(blockId, setInstitutes) {
  useEffect(() => {
    let isMounted = true;

    if (!blockId) {
      setInstitutes([]);
      return;
    }

    const fetchInstitutes = async () => {
      try {
        const clusterRes = await axios.get(
          `${API_BASE_URL}/api/clusters-by-block/${blockId}`
        );
        const clusters = Array.isArray(clusterRes.data)
          ? clusterRes.data
          : clusterRes.data.data || [];

        const instituteRequests = clusters.map((c) =>
          axios.get(`${API_BASE_URL}/api/institutes-by-cluster/${c.id}`)
        );

        const instituteResponses = await Promise.all(instituteRequests);

        const allInstitutes = instituteResponses.flatMap((res) =>
          Array.isArray(res.data) ? res.data : res.data.data || []
        );

        if (isMounted) setInstitutes(allInstitutes);
      } catch (err) {
        console.error("Error fetching institutes:", err);
        if (isMounted) setInstitutes([]);
      }
    };

    fetchInstitutes();
    return () => (isMounted = false);
  }, [blockId, setInstitutes]);
}

/* =========================================================
   Fetch Jurisdiction Name by Code
========================================================= */
export function useJurisName(juris_code, setJurisName) {
  useEffect(() => {
    let isMounted = true;

    if (!juris_code) {
      setJurisName("");
      return;
    }

    const fetchJurisName = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/juris-name/${juris_code}`
        );
        if (isMounted) setJurisName(res.data?.name || "");
      } catch (err) {
        console.error("Error fetching jurisdiction name:", err);
        if (isMounted) setJurisName("");
      }
    };

    fetchJurisName();
    return () => (isMounted = false);
  }, [juris_code, setJurisName]);
}
