import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
const InterviewSchedule = () => {
    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Interview Schedule</CardTitle>
                    <CardDescription>Manage your interview schedules here</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is where interviewers can view and manage their interview schedules.</p>
                </CardContent>
            </Card>
        </div>
    );
}
export default InterviewSchedule;