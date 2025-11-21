import React from 'react';

const TimetableTable = ({ data, logoSrc }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
        No schedule found for the selected batch.
      </div>
    );
  }

  // 1. Group the schedule by day
  const groupedTimetable = data.reduce((acc, item) => {
    const day = item.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {});

  // 2. Define the proper order for days
  const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className="relative p-2">
      {/* Logo in the top right corner */}
      {logoSrc && (
        <img
          src={logoSrc}
          alt="Organization Logo"
          className="w-24 h-auto" // Adjust size as needed (e.g., w-24 = 6rem width)
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            zIndex: 10 // Ensure the logo is clearly visible
          }}
        />
      )}

      {/* Render the timetable, grouped by day */}
      {daysOrder.map(day => {
        const dailySchedule = groupedTimetable[day];
        if (!dailySchedule || dailySchedule.length === 0) return null;

        return (
          <div key={day} className="mb-10 pt-4"> {/* Added padding top for logo spacing */}
            <h3 className="text-xl font-bold mb-4 text-indigo-700 border-b-2 border-indigo-200 pb-1">
              {day}
            </h3>
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Classroom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Link</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailySchedule.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{item.start_time} - {item.end_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{item.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{item.teacher}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{item.classroom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {item.joining_link ? (
                        <a href={item.joining_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Click to Join
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default TimetableTable;