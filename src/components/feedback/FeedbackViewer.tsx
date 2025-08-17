import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Feedback {
  id: string;
  comments?: string;
  rating?: number;
  feedback_type: string;
  created_at: string;
}

interface FeedbackViewerProps {
  userId: string;
}

const FeedbackViewer: React.FC<FeedbackViewerProps> = ({ userId }) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, [userId]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('intern_id', userId)
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

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'task': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return <div className="text-center py-8">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Feedback</h2>
        <p className="text-muted-foreground">View feedback and evaluations from your supervisor</p>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.created_at).toLocaleDateString()}
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
            <p className="text-lg font-medium">No feedback yet</p>
            <p className="text-muted-foreground">Your supervisor will provide feedback as you progress</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackViewer;