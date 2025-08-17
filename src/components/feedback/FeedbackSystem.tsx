import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, MessageSquare, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendFeedbackNotification } from '@/services/notificationService';

interface Feedback {
  id: string;
  comments?: string;
  rating?: number;
  feedback_type: string;
  intern_id: string;
  supervisor_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface FeedbackSystemProps {
  userRole: string;
  userId: string;
}

const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ userRole, userId }) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();

  const [newFeedback, setNewFeedback] = useState({
    comments: '',
    rating: 0,
    feedback_type: 'general',
    intern_id: '',
  });

  useEffect(() => {
    fetchFeedback();
    fetchInterns();
  }, [userId]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('supervisor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to fetch feedback",
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

  const createFeedback = async () => {
    if (!newFeedback.intern_id) {
      toast({
        title: "Validation Error",
        description: "Please select an intern",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('feedback').insert({
        comments: newFeedback.comments || null,
        rating: newFeedback.rating > 0 ? newFeedback.rating : null,
        feedback_type: newFeedback.feedback_type,
        intern_id: newFeedback.intern_id,
        supervisor_id: userId,
      });

      if (error) throw error;

      // Send notification to the intern
      const selectedIntern = interns.find(i => i.id === newFeedback.intern_id);
      const { data: supervisorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (selectedIntern && supervisorProfile) {
        await sendFeedbackNotification(newFeedback.intern_id, supervisorProfile.full_name, newFeedback.feedback_type);
      }

      toast({
        title: "Success",
        description: "Feedback submitted successfully and intern notified",
      });

      setNewFeedback({
        comments: '',
        rating: 0,
        feedback_type: 'general',
        intern_id: '',
      });
      setSelectedRating(0);
      setIsDialogOpen(false);
      fetchFeedback();
    } catch (error) {
      console.error('Error creating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'task': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInternName = (internId: string) => {
    const intern = interns.find(i => i.id === internId);
    return intern ? intern.full_name : 'Unknown';
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < (interactive ? (hoveredRating || selectedRating) : rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
        onClick={interactive ? () => {
          setSelectedRating(i + 1);
          setNewFeedback({ ...newFeedback, rating: i + 1 });
        } : undefined}
        onMouseEnter={interactive ? () => setHoveredRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
      />
    ));
  };

  if (loading) {
    return <div className="text-center py-8">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Feedback Management</h2>
          <p className="text-muted-foreground">Provide feedback and evaluations for interns</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Give Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Feedback</DialogTitle>
              <DialogDescription>Give feedback and evaluation to an intern</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="intern_id">Select Intern</Label>
                <Select value={newFeedback.intern_id} onValueChange={(value) => setNewFeedback({ ...newFeedback, intern_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an intern" />
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
              
              <div>
                <Label htmlFor="feedback_type">Feedback Type</Label>
                <Select value={newFeedback.feedback_type} onValueChange={(value) => setNewFeedback({ ...newFeedback, feedback_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="task">Task-specific</SelectItem>
                    <SelectItem value="performance">Performance Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Rating (Optional)</Label>
                <div className="flex gap-1 mt-2">
                  {renderStars(selectedRating, true)}
                </div>
              </div>
              
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={newFeedback.comments}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                  placeholder="Provide detailed feedback..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFeedback}>
                  Submit Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {feedback.length > 0 ? (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getFeedbackTypeColor(item.feedback_type)}>
                        {item.feedback_type}
                      </Badge>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          {renderStars(item.rating)}
                          <span className="text-sm text-muted-foreground ml-1">
                            ({item.rating}/5)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {getInternName(item.intern_id)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {item.comments && (
                <CardContent>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm leading-relaxed">{item.comments}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No feedback given yet</p>
            <p className="text-muted-foreground">Start by providing feedback to your interns</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackSystem;