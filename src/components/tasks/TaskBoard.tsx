import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createNotification, notificationTemplates } from '@/services/notificationService';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface TaskBoardProps {
  userRole: 'supervisor' | 'intern';
  userId: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ userRole, userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchTasks();
    if (userRole === 'supervisor') {
      fetchInterns();
    }
  }, [userRole, userId]);

  const fetchTasks = async () => {
    try {
      let query = supabase.from('tasks').select('*');
      
      if (userRole === 'supervisor') {
        query = query.eq('created_by', userId);
      } else {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern');

      if (error) throw error;

      setInterns(data || []);
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        created_by: userId,
        assigned_to: newTask.assigned_to || null,
        status: 'todo',
      });

      if (error) throw error;

      // Send notification to assigned intern
      if (newTask.assigned_to) {
        await createNotification({
          userId: newTask.assigned_to,
          ...notificationTemplates.taskAssigned(newTask.title),
          data: { taskId: null, taskTitle: newTask.title }
        });
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
      });
      setIsDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Prevent moving backwards in the workflow for security
    const statusOrder = { 'todo': 0, 'in_progress': 1, 'done': 2 };
    const currentOrder = statusOrder[task.status];
    const newOrder = statusOrder[newStatus];
    
    if (newOrder < currentOrder) {
      toast({
        title: "Invalid Action",
        description: "Tasks cannot be moved backward in the workflow",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // Send notification to supervisor when task is completed
      if (newStatus === 'done') {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Get intern name
          const { data: internData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          if (internData) {
            await createNotification({
              userId: task.created_by,
              ...notificationTemplates.taskCompleted(task.title, internData.full_name),
              data: { taskId, taskTitle: task.title }
            });
          }
        }
      }

      toast({
        title: "Success",
        description: "Task status updated",
      });

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTasksByStatus = (status: 'todo' | 'in_progress' | 'done') => {
    const filteredTasks = tasks.filter(task => task.status === status);
    
    return (
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{task.title}</h4>
                <div className="flex gap-1">
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {userRole === 'intern' && (
                  <div className="flex gap-1">
                    {status === 'todo' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="h-6 px-2 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        Start Progress
                      </Button>
                    )}
                    {status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'done')}
                        className="h-6 px-2 text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {userRole === 'supervisor' ? 'Task Management' : 'My Tasks'}
          </h2>
          <p className="text-muted-foreground">
            {userRole === 'supervisor' 
              ? 'Create and manage tasks for your interns'
              : 'View and update your assigned tasks'
            }
          </p>
        </div>
        
        {userRole === 'supervisor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Create a new task and assign it to an intern
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an intern" />
                    </SelectTrigger>
                    <SelectContent>
                      {interns.map((intern) => (
                        <SelectItem key={intern.id} value={intern.id}>
                          {intern.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTask}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Enhanced Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card className="border-l-4 border-l-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-slate-500 shadow-sm"></div>
                To Do
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">{tasks.filter(t => t.status === 'todo').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 min-h-[400px]">
              {renderTasksByStatus('todo')}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-l-4 border-l-blue-400 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
                In Progress
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">{tasks.filter(t => t.status === 'in_progress').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 min-h-[400px]">
              {renderTasksByStatus('in_progress')}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-l-4 border-l-green-400 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                Done
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">{tasks.filter(t => t.status === 'done').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 min-h-[400px]">
              {renderTasksByStatus('done')}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;