import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Phone, MapPin, Calendar, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  created_at: string;
}

interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
}

interface InternWithStats extends Profile {
  stats: TaskStats;
  hasCheckedInToday: boolean;
}

const InternManagement: React.FC = () => {
  const [interns, setInterns] = useState<InternWithStats[]>([]);
  const [filteredInterns, setFilteredInterns] = useState<InternWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInternsCount, setActiveInternsCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    // Filter interns based on search term
    const filtered = interns.filter(intern =>
      intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intern.department && intern.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredInterns(filtered);
  }, [interns, searchTerm]);

  const fetchInterns = async () => {
    try {
      // Fetch all interns
      const { data: internData, error: internError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern')
        .order('created_at', { ascending: false });

      if (internError) throw internError;

      const today = new Date().toISOString().split('T')[0];

      // Fetch task statistics and attendance for each intern
      const internsWithStats = await Promise.all(
        (internData || []).map(async (intern) => {
          const { count: totalTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('assigned_to', intern.id);

          const { count: completedTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('assigned_to', intern.id)
            .eq('status', 'done');

          const { count: inProgressTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('assigned_to', intern.id)
            .eq('status', 'in_progress');

          // Check if intern has checked in today
          const { data: todayAttendance } = await supabase
            .from('attendance')
            .select('check_in_time')
            .eq('user_id', intern.id)
            .eq('date', today)
            .maybeSingle();

          const hasCheckedInToday = todayAttendance?.check_in_time !== null;

          return {
            ...intern,
            stats: {
              total: totalTasks || 0,
              completed: completedTasks || 0,
              in_progress: inProgressTasks || 0,
            },
            hasCheckedInToday,
          };
        })
      );

      const activeCount = internsWithStats.filter(intern => intern.hasCheckedInToday).length;
      setActiveInternsCount(activeCount);
      setInterns(internsWithStats);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch intern data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (completed: number, total: number) => {
    if (total === 0) return 'bg-gray-100 text-gray-800';
    const percentage = (completed / total) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceLabel = (completed: number, total: number) => {
    if (total === 0) return 'No tasks';
    const percentage = (completed / total) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (loading) {
    return <div className="text-center py-8">Loading intern data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Intern Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage your intern team
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interns by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{interns.length}</div>
            <p className="text-sm text-muted-foreground">Total Interns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {activeInternsCount}
            </div>
            <p className="text-sm text-muted-foreground">Active Interns (Checked In Today)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {interns.reduce((sum, i) => sum + i.stats.total, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {interns.reduce((sum, i) => sum + i.stats.completed, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Completed Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Intern List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInterns.map((intern) => (
          <Card key={intern.id} className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm shadow-lg ${intern.hasCheckedInToday ? 'ring-2 ring-emerald-200' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg font-bold">
                        {getInitials(intern.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {intern.hasCheckedInToday && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">{intern.full_name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getPerformanceColor(intern.stats.completed, intern.stats.total)} font-medium`}>
                        {getPerformanceLabel(intern.stats.completed, intern.stats.total)}
                      </Badge>
                      {intern.hasCheckedInToday && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Active Today
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm group">
                  <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 truncate">{intern.email}</span>
                </div>
                {intern.phone && (
                  <div className="flex items-center gap-3 text-sm group">
                    <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{intern.phone}</span>
                  </div>
                )}
                {intern.department && (
                  <div className="flex items-center gap-3 text-sm group">
                    <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700">{intern.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm group">
                  <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">Joined {new Date(intern.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Task Performance</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-xl font-bold text-gray-900">{intern.stats.total}</div>
                    <div className="text-xs text-gray-500 font-medium">Total</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-xl font-bold text-blue-600">{intern.stats.in_progress}</div>
                    <div className="text-xs text-gray-500 font-medium">Active</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-xl font-bold text-emerald-600">{intern.stats.completed}</div>
                    <div className="text-xs text-gray-500 font-medium">Done</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {intern.stats.total > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Completion Rate</span>
                      <span className="font-bold text-gray-900">{Math.round((intern.stats.completed / intern.stats.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(intern.stats.completed / intern.stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200 hover:border-green-300 font-medium"
                  onClick={() => {
                    if (!intern.phone) {
                      toast({
                        title: "No phone number",
                        description: "This intern hasn't added their phone number yet",
                        variant: "destructive",
                      });
                      return;
                    }
                    const cleanNumber = intern.phone.replace(/\D/g, '');
                    const whatsappUrl = `https://wa.me/${cleanNumber}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200 hover:border-blue-300 font-medium"
                  onClick={() => {
                    if (!intern.phone) {
                      toast({
                        title: "No phone number",
                        description: "This intern hasn't added their phone number yet",
                        variant: "destructive",
                      });
                      return;
                    }
                    const telUrl = `tel:${intern.phone}`;
                    window.open(telUrl, '_self');
                  }}
                  disabled={!intern.phone}
                >
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterns.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No interns found matching your search.' : 'No interns found.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InternManagement;