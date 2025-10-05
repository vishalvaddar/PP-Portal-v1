import React from 'react';
import { Clock, MapPin } from 'lucide-react';

export default function UpcomingClasses() {
  const classes = [
    { subject: 'Mathematics', time: '09:00 AM', room: 'Room 101', batch: 'Batch A' },
    { subject: 'Physics', time: '11:00 AM', room: 'Room 102', batch: 'Batch B' },
    { subject: 'Chemistry', time: '02:00 PM', room: 'Room 103', batch: 'Batch A' },
    { subject: 'Biology', time: '04:00 PM', room: 'Room 104', batch: 'Batch C' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Classes</h3>
      <div className="space-y-4">
        {classes.map((class_, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{class_.subject}</p>
              <p className="text-sm text-gray-600">{class_.batch}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4 mr-1" />
                {class_.time}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {class_.room}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}