import { useEffect } from "react";
import axios from "axios";

export function useFetchStates(setStates) {
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/states");
                setStates(response.data);
            } catch (error) {
                console.error("Error fetching states:", error);
            }
        };
        fetchStates();
    }, [setStates])
}

export function useFetchDistricts(stateId, setDistricts) {
    useEffect(() => {
        const fetchDistricts = async () => {
            if (stateId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/districts-by-state/${stateId}`);
                    setDistricts(response.data);
                } catch (error) {
                    console.error("Error fetching districts:", error);
                }
            } else {
                setDistricts([]);
            }
        };
        fetchDistricts();
    }, [stateId, setDistricts])
}

export function useFetchBlocks(districtId, setBlocks) {
    useEffect(() => {
        const fetchBlocks = async () => {
            if (districtId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/blocks-by-district/${districtId}`);
                    setBlocks(response.data);
                } catch (error) {
                    console.error("Error fetching blocks:", error);
                }
            } else {
                setBlocks([]);
            }
        };
        fetchBlocks();
    }, [districtId, setBlocks])
}

export function useFetchInstitutes(blockId, setInstitutes) {
    useEffect(() => {
        const fetchInstitutes = async () => {
            if (blockId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/institutes-by-block/${blockId}`);
                    setInstitutes(response.data);
                } catch (error) {
                    console.error("Error fetching institutes:", error);
                }
            } else {
                setInstitutes([]);
            }
        };
        fetchInstitutes();
    }, [blockId, setInstitutes])
}