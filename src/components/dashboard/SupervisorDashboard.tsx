import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Calendar, MessageSquare, Award, BarChart3, LogOut, Plus, Clock, CheckSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TaskBoard from '@/components/tasks/TaskBoard';
import InternManagement from '@/components/supervisor/InternManagement';
import EventCalendar from '@/components/calendar/EventCalendar';
import MessagingSystem from '@/components/messaging/MessagingSystem';
import CertificateManager from '@/components/certificates/CertificateManager';
import FeedbackSystem from '@/components/feedback/FeedbackSystem';
import AttendanceSystem from '@/components/attendance/AttendanceSystem';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import ProfileEditor from '@/components/profile/ProfileEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Profile {
  id: string;
  role: string;
  full_name: string;
  email: string;
  department?: string;
  phone?: string;
}

interface SupervisorDashboardProps {
  profile: Profile;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ profile: initialProfile }) => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch intern count
      const { count: internCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'intern');

      // Fetch task counts
      const { count: activeTaskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('created_by', profile.id)
        .neq('status', 'done');

      const { count: completedTaskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('created_by', profile.id)
        .eq('status', 'done');

      // Fetch upcoming events count
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('created_by', profile.id)
        .gte('start_time', new Date().toISOString());

      setStats({
        totalInterns: internCount || 0,
        activeTasks: activeTaskCount || 0,
        completedTasks: completedTaskCount || 0,
        upcomingEvents: eventCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/20 px-4 lg:px-6 py-4 sticky top-0 z-50 shadow-sm w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 lg:h-7 lg:w-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">NTC Supervisor Portal</h1>
              <p className="text-xs lg:text-sm text-primary font-medium">Nepal Telecom</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <NotificationCenter />
            <div className="hidden sm:flex items-center space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-semibold text-xs lg:text-sm hover:opacity-90 transition-opacity">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                  </DialogHeader>
                  <ProfileEditor profile={profile} onProfileUpdate={setProfile} />
                </DialogContent>
              </Dialog>
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-primary capitalize font-medium">{profile.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Modern Sidebar */}
        <aside className="hidden lg:block w-72 bg-white/70 backdrop-blur-sm border-r border-primary/20 min-h-[calc(100vh-5rem)] shadow-sm">
          <div className="p-6">
            {/* User Profile Card */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-white mb-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.full_name.split(' ')[0]}</h3>
                  <p className="text-white/80 text-sm capitalize">{profile.role}</p>
                  <p className="text-white/70 text-xs">{profile.department}</p>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
              <TabsList className="grid w-full grid-rows-7 h-auto p-0 gap-2 bg-transparent">
                <TabsTrigger 
                  value="overview" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  <span className="font-medium">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="interns" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <Users className="h-5 w-5 mr-3" />
                  <span className="font-medium">Interns</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <CheckSquare className="h-5 w-5 mr-3" />
                  <span className="font-medium">Tasks</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  <span className="font-medium">Calendar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="messages" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <MessageSquare className="h-5 w-5 mr-3" />
                  <span className="font-medium">Messages</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="feedback" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <span className="font-medium">Feedback</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="certificates" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <Award className="h-5 w-5 mr-3" />
                  <span className="font-medium">Certificates</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="attendance" 
                  className="w-full justify-start p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-primary/5 border-0"
                >
                  <Clock className="h-5 w-5 mr-3" />
                  <span className="font-medium">Attendance</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-6">
              <TabsList className="grid grid-cols-4 w-full bg-white/70 p-1 rounded-xl">
                <TabsTrigger value="overview" className="text-xs p-2">Dashboard</TabsTrigger>
                <TabsTrigger value="interns" className="text-xs p-2">Interns</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs p-2">Tasks</TabsTrigger>
                <TabsTrigger value="messages" className="text-xs p-2">Messages</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Hello, {profile.full_name.split(' ')[0]}</h2>
                  <p className="text-sm lg:text-base text-gray-600">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg w-full sm:w-auto" onClick={() => setActiveTab('tasks')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Task
                </Button>
              </div>

              {/* Project Cards - inspired by the reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                            +{stats.totalInterns}
                          </div>
                        </div>
                      </div>
                      <div className="text-white/80">●●●</div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Intern Management</h3>
                    <p className="text-blue-100 text-sm mb-4">Supervise all interns</p>
                    <div className="text-sm text-blue-100 mb-2">{stats.totalInterns} interns • Active</div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                            +{stats.activeTasks}
                          </div>
                        </div>
                      </div>
                      <div className="text-white/80">●●●</div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Task Oversight</h3>
                    <p className="text-purple-100 text-sm mb-4">Monitor task progress</p>
                    <div className="text-sm text-purple-100 mb-2">{stats.activeTasks} active tasks • {stats.activeTasks > 0 ? Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100) : 0}%</div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300" 
                        style={{ width: `${stats.activeTasks > 0 ? (stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                            +{stats.completedTasks}
                          </div>
                        </div>
                      </div>
                      <div className="text-white/80">●●●</div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Achievements</h3>
                    <p className="text-green-100 text-sm mb-4">Tasks completed</p>
                    <div className="text-sm text-green-100 mb-2">{stats.completedTasks} completed • 100%</div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Management Tasks */}
                <div className="lg:col-span-2">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-xl">Management Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Intern Supervision</h4>
                          <p className="text-sm text-gray-600">Monitor intern progress and assignments</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveTab('interns')}>
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-400">
                        <div className="w-3 h-3 bg-purple-400 rounded-full" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Task Assignment</h4>
                          <p className="text-sm text-gray-600">Create and assign new tasks</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveTab('tasks')}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Certificate Issuance</h4>
                          <p className="text-sm text-gray-600">Issue completion certificates</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveTab('certificates')}>
                          <Award className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Statistics */}
                <div>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-xl">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</div>
                        <p className="text-sm text-gray-600">Upcoming Events</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.totalInterns}</div>
                        <p className="text-sm text-gray-600">Total Interns</p>
                      </div>
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
                          <div className="text-2xl font-bold">Supervisor</div>
                          <p className="text-sm text-blue-100">Management Portal</p>
                          <p className="text-xs text-blue-200">Full access to all features!</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interns" className="animate-fade-in">
              <InternManagement />
            </TabsContent>

            <TabsContent value="tasks" className="animate-fade-in">
              <TaskBoard userRole="supervisor" userId={profile.id} />
            </TabsContent>

            <TabsContent value="calendar" className="animate-fade-in">
              <EventCalendar userRole="supervisor" userId={profile.id} />
            </TabsContent>

            <TabsContent value="messages" className="animate-fade-in">
              <MessagingSystem userRole="supervisor" userId={profile.id} />
            </TabsContent>

            <TabsContent value="feedback" className="animate-fade-in">
              <FeedbackSystem userRole="supervisor" userId={profile.id} />
            </TabsContent>

            <TabsContent value="certificates" className="animate-fade-in">
              <CertificateManager userRole="supervisor" userId={profile.id} />
            </TabsContent>

            <TabsContent value="attendance" className="animate-fade-in">
              <AttendanceSystem userRole="supervisor" />
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default SupervisorDashboard;