import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

const InterviewerDashboard = () => {
    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Interviewer Dashboard</CardTitle>
                    <CardDescription>Welcome to the Interviewer Dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is where interviewers can manage their interviews and view schedules.</p>
                </CardContent>
            </Card>
        </div>
    );
}
export default InterviewerDashboard;