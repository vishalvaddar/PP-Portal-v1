import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LogoutHandler() {
  const { logout } = useAuth();   // this should clear tokens/localStorage/session
  const navigate = useNavigate();

  useEffect(() => {
    logout();          // clear user auth/session
    navigate("/"); // redirect to login page
  }, [logout, navigate]);

  return null; // no UI needed
}
