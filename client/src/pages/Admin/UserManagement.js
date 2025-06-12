import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

const UserManagement = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">👥 User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section will allow Admins to manage Batch Coordinators. You can:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>Create new coordinator accounts</li>
            <li>View & edit coordinator details</li>
            <li>Assign one or more batches to each coordinator</li>
          </ul>

          <p className="text-sm text-gray-400 mt-4">
            (Feature development in progress...)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
