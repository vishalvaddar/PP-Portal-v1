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
      <div className="evaluation-dashboard p-6">
      <div className="header mb-6">
        <h1 className="text-2xl font-bold">Evaluation Dashboard</h1>
        <p className="text-gray-600">Make Easy & Remove Management</p>
      </div>

      <div className="checklist mb-8">
        <div className="flex items-center mb-2">
          <input type="checkbox" className="mr-2" id="update-users" />
          <label htmlFor="update-users">Apply to update users, regardless whether or not.</label>
        </div>
        <div className="flex items-center mb-2">
          <input type="checkbox" className="mr-2" id="attribute" checked />
          <label htmlFor="attribute">Attribute</label>
        </div>
        <div className="flex items-center">
          <input type="checkbox" className="mr-2" id="all-share" />
          <label htmlFor="all-share">All Share</label>
        </div>
      </div>

      <div className="dashboard-grid mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">B Deshared</th>
              <th className="border p-2">B More Easy</th>
              <th className="border p-2">B Numbers</th>
              <th className="border p-2">B Trading</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Last Name: 1245</td>
              <td className="border p-2">892</td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2" colSpan="4">Overall Evaluation Progress</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="complete-use mb-8">
        <h3 className="font-bold mb-2">Complete Use</h3>
        <p>Yes</p>
      </div>

      <div className="stats-grid grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-3xl font-bold">134</p>
          <p>Interview Confident</p>
        </div>
        <div>
          <p className="text-3xl font-bold">156</p>
          <p>Interview Standard</p>
        </div>
      </div>

      <hr className="my-6" />

      <div className="recent-activity mb-8">
        <h3 className="font-bold mb-2">Recent Activity</h3>
        <ul className="list-disc pl-5">
          <li>Select Shares</li>
          <li>Make almost no internal assurance</li>
        </ul>
      </div>

      <div className="rating-tests mb-8">
        <h3 className="font-bold mb-2">Rating Tests</h3>
        <div className="flex space-x-4">
          <p className="text-2xl">198</p>
          <p className="text-2xl">155</p>
        </div>
      </div>

      <div className="batch-progress mb-8">
        <h3 className="font-bold mb-2">Batch-wise Progress</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>Batch 2024-A</div>
          <div>Batch 2024-B</div>
          <div>Batch 2024-C</div>
          <div>Batch 2024-D</div>
          <div>Batch 2024-E</div>
        </div>
      </div>

      <div className="total-ip">
        <h3 className="font-bold mb-2">Total IP</h3>
        <p>7 hours</p>
      </div>
    </div>

      
    </div>
  );
};

export default EvaluationDashboard;
