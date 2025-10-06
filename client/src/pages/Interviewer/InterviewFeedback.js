import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
const InterviewFeedback = () => {
    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Interview Feedback</CardTitle>
                    <CardDescription>Provide your feedback for the interview</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is where interviewers can submit their feedback for candidates.</p>
                </CardContent>
            </Card>
        </div>
    );
}
export default InterviewFeedback;