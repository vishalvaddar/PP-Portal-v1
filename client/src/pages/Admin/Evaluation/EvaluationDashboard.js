// pages/Admin/Evaluation/EvaluationDashboard.jsx

import React from "react";
import { Link } from "react-router-dom";

const EvaluationDashboard = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to=""
          className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 text-center"
        >
           Evaluation Dashboard
        </Link>
        <Link
          to="marks-entry"
          className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 text-center"
        >
          📝 Marks Entry
        </Link>
        <Link
          to="interview"
          className="p-4 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 text-center"
        >
          🧑‍💼 Interview
        </Link>
        <Link
          to="tracking"
          className="p-4 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 text-center"
        >
          📊 Evaluation Tracking
        </Link>
      </div>
  
   
      
    </div>
  );
};

export default EvaluationDashboard;
