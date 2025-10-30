import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

const InterviewerDashboard = () => {
    const [stats, setStats] = useState({
        upcomingInterviews: 0,
        completedInterviews: 0,
        todayInterviews: 0,
        assignedCandidates: 0
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // In a real implementation, this would fetch actual data from the backend
        // For now, we'll simulate loading data
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // This would be a real API call in production
                // const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/interviewer/dashboard`, {
                //     headers: { Authorization: `Bearer ${user.token}` }
                // });
                
                // Simulated data
                setTimeout(() => {
                    setStats({
                        upcomingInterviews: 5,
                        completedInterviews: 12,
                        todayInterviews: 2,
                        assignedCandidates: 8
                    });
                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const navigateTo = (path) => {
        navigate(path);
    };

    if (loading) {
        return <div className="p-4">Loading dashboard data...</div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Welcome, {user?.user_name}</h1>
                <p className="text-gray-500">Role: Interviewer</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Upcoming Interviews</p>
                            <h3 className="text-2xl font-bold">{stats.upcomingInterviews}</h3>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <h3 className="text-2xl font-bold">{stats.completedInterviews}</h3>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="bg-amber-100 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Today's Interviews</p>
                            <h3 className="text-2xl font-bold">{stats.todayInterviews}</h3>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Assigned Candidates</p>
                            <h3 className="text-2xl font-bold">{stats.assignedCandidates}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Access frequently used features</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 h-16"
                        onClick={() => navigateTo('/interviewer/interview-schedule')}
                    >
                        <Calendar className="h-5 w-5" />
                        <span>View Interview Schedule</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 h-16"
                        onClick={() => navigateTo('/interviewer/interview-feedback')}
                    >
                        <CheckCircle className="h-5 w-5" />
                        <span>Submit Interview Feedback</span>
                    </Button>
                </CardContent>
            </Card>
            
            {/* Today's Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>Your interviews for today</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.todayInterviews > 0 ? (
                        <div className="space-y-4">
                            {/* This would be populated with actual interview data */}
                            <div className="p-4 border rounded-md">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-medium">Rahul Sharma</p>
                                        <p className="text-sm text-gray-500">10:30 AM - 11:00 AM</p>
                                    </div>
                                    <Button size="sm" onClick={() => navigateTo('/interviewer/interview-feedback')}>
                                        Provide Feedback
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 border rounded-md">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-medium">Priya Patel</p>
                                        <p className="text-sm text-gray-500">2:00 PM - 2:30 PM</p>
                                    </div>
                                    <Button size="sm" onClick={() => navigateTo('/interviewer/interview-feedback')}>
                                        Provide Feedback
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center py-6 text-gray-500">No interviews scheduled for today</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InterviewerDashboard;