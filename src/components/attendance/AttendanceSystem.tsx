import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, CheckCircle, XCircle, Users, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  notes: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

interface AttendanceSystemProps {
  userRole: string;
}

const AttendanceSystem: React.FC<AttendanceSystemProps> = ({ userRole }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');

  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
      fetchRecentAttendance();
      if (userRole === 'supervisor') {
        fetchInterns();
        fetchAllAttendance();
      }
    }
  }, [user, userRole, selectedIntern]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const attendanceSubscription = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          fetchTodayAttendance();
          fetchRecentAttendance();
          if (userRole === 'supervisor') {
            fetchAllAttendance();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceSubscription);
    };
  }, [user, userRole, selectedIntern]);

  const fetchInterns = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('role', 'intern')
        .order('full_name');

      if (error) {
        console.error('Error fetching interns:', error);
        return;
      }

      setInterns(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today attendance:', error);
        return;
      }

      setTodayAttendance(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(7);

      if (error) {
        console.error('Error fetching recent attendance:', error);
        return;
      }

      setRecentAttendance(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (selectedIntern !== 'all') {
        query = query.eq('user_id', selectedIntern);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all attendance:', error);
        return;
      }

      // Fetch user names separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(record => record.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Map user names to attendance records
        const attendanceWithNames = data.map(record => ({
          ...record,
          user_name: profiles?.find(p => p.id === record.user_id)?.full_name || 'Unknown User'
        }));

        setAllAttendance(attendanceWithNames as AttendanceRecord[]);
      } else {
        setAllAttendance([]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('attendance')
        .upsert({
          user_id: user!.id,
          date: today,
          check_in_time: now,
          status: 'present'
        });

      if (error) {
        console.error('Error checking in:', error);
        toast({
          title: "Error",
          description: "Failed to check in. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Checked in successfully!",
      });
      
      fetchTodayAttendance();
      fetchRecentAttendance();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: now })
        .eq('id', todayAttendance!.id);

      if (error) {
        console.error('Error checking out:', error);
        toast({
          title: "Error",
          description: "Failed to check out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Checked out successfully!",
      });
      
      fetchTodayAttendance();
      fetchRecentAttendance();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditAttendance = async () => {
    if (!editingAttendance) return;

    try {
      const updateData: any = {};
      
      if (editCheckIn) {
        updateData.check_in_time = new Date(editCheckIn).toISOString();
      }
      
      if (editCheckOut) {
        updateData.check_out_time = new Date(editCheckOut).toISOString();
      }

      const { error } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('id', editingAttendance.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update attendance.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Attendance updated successfully!",
      });

      setEditingAttendance(null);
      setEditCheckIn('');
      setEditCheckOut('');
      fetchAllAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setEditingAttendance(record);
    setEditCheckIn(record.check_in_time ? format(new Date(record.check_in_time), "yyyy-MM-dd'T'HH:mm") : '');
    setEditCheckOut(record.check_out_time ? format(new Date(record.check_out_time), "yyyy-MM-dd'T'HH:mm") : '');
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.check_out_time) {
      return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Complete</Badge>;
    } else if (record.check_in_time) {
      return <Badge variant="secondary">Checked In</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">
            {userRole === 'intern' ? 'Track your daily attendance' : 'Monitor intern attendance'}
          </p>
        </div>
        
        {userRole === 'supervisor' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedIntern} onValueChange={setSelectedIntern}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select intern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Interns</SelectItem>
                  {interns.map((intern) => (
                    <SelectItem key={intern.id} value={intern.id}>
                      {intern.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {userRole === 'intern' && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Attendance - {format(new Date(), 'MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {todayAttendance ? (
                  <div className="flex items-center gap-4">
                    {todayAttendance.check_in_time && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-muted-foreground">
                          Checked in: {format(new Date(todayAttendance.check_in_time), 'hh:mm a')}
                        </span>
                      </div>
                    )}
                    {todayAttendance.check_out_time && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          Checked out: {format(new Date(todayAttendance.check_out_time), 'hh:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No attendance marked today</span>
                )}
              </div>
              <div className="flex gap-2">
                {!todayAttendance?.check_in_time ? (
                  <Button onClick={handleCheckIn} className="bg-emerald-600 hover:bg-emerald-700">
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                ) : !todayAttendance?.check_out_time ? (
                  <Button onClick={handleCheckOut} variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                ) : (
                  <Badge variant="default" className="bg-emerald-500">
                    Day Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supervisor Check-In/Out */}
      {userRole === 'supervisor' && (
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Supervisor Attendance - {format(new Date(), 'MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {todayAttendance ? (
                  <div className="flex items-center gap-4">
                    {todayAttendance.check_in_time && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-muted-foreground">
                          Checked in: {format(new Date(todayAttendance.check_in_time), 'hh:mm a')}
                        </span>
                      </div>
                    )}
                    {todayAttendance.check_out_time && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-accent" />
                        <span className="text-sm text-muted-foreground">
                          Checked out: {format(new Date(todayAttendance.check_out_time), 'hh:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No attendance marked today</span>
                )}
              </div>
              <div className="flex gap-2">
                {!todayAttendance?.check_in_time ? (
                  <Button onClick={handleCheckIn} className="bg-emerald-600 hover:bg-emerald-700">
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                ) : !todayAttendance?.check_out_time ? (
                  <Button onClick={handleCheckOut} variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                ) : (
                  <Badge variant="default" className="bg-emerald-500">
                    Day Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === 'supervisor' ? 'All Attendance Records' : 'Your Recent Attendance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {userRole === 'supervisor' && <th className="text-left p-2">Employee</th>}
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Check In</th>
                  <th className="text-left p-2">Check Out</th>
                  <th className="text-left p-2">Status</th>
                  {userRole === 'supervisor' && <th className="text-left p-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(userRole === 'supervisor' ? allAttendance : recentAttendance).map((record) => (
                  <tr key={record.id} className="border-b">
                    {userRole === 'supervisor' && (
                      <td className="p-2 font-medium">
                        {(record as any).user_name || 'Unknown User'}
                      </td>
                    )}
                    <td className="p-2">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                    <td className="p-2">
                      {record.check_in_time 
                        ? format(new Date(record.check_in_time), 'hh:mm a')
                        : '-'
                      }
                    </td>
                    <td className="p-2">
                      {record.check_out_time 
                        ? format(new Date(record.check_out_time), 'hh:mm a')
                        : '-'
                      }
                    </td>
                    <td className="p-2">{getStatusBadge(record)}</td>
                    {userRole === 'supervisor' && (
                      <td className="p-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditDialog(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Attendance</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Check In Time</label>
                                <Input
                                  type="datetime-local"
                                  value={editCheckIn}
                                  onChange={(e) => setEditCheckIn(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Check Out Time</label>
                                <Input
                                  type="datetime-local"
                                  value={editCheckOut}
                                  onChange={(e) => setEditCheckOut(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleEditAttendance} className="w-full">
                                Update Attendance
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {(userRole === 'supervisor' ? allAttendance : recentAttendance).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSystem;