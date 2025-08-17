import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendEventNotification } from '@/services/notificationService';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: string;
  created_by: string;
  attendees: string[];
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface EventCalendarProps {
  userRole: 'supervisor' | 'intern';
  userId: string;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ userRole, userId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'meeting',
    attendees: [] as string[],
  });

  useEffect(() => {
    fetchEvents();
    if (userRole === 'supervisor') {
      fetchInterns();
    }
  }, [userRole, userId]);

  const fetchEvents = async () => {
    try {
      let query = supabase.from('events').select('*');
      
      if (userRole === 'supervisor') {
        query = query.eq('created_by', userId);
      } else {
        query = query.contains('attendees', [userId]);
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
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

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.start_time || !newEvent.end_time) {
      toast({
        title: "Validation Error",
        description: "Title, start time, and end time are required",
        variant: "destructive",
      });
      return;
    }

    if (new Date(newEvent.start_time) >= new Date(newEvent.end_time)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('events').insert({
        title: newEvent.title,
        description: newEvent.description,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        location: newEvent.location,
        event_type: newEvent.event_type,
        created_by: userId,
        attendees: newEvent.attendees,
      });

      if (error) throw error;

      // Send notifications to all attendees
      if (newEvent.attendees.length > 0) {
        await sendEventNotification({
          id: 'new-event',
          title: newEvent.title,
          start_time: newEvent.start_time,
          location: newEvent.location
        }, newEvent.attendees);
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      setNewEvent({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        event_type: 'meeting',
        attendees: [],
      });
      setIsDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-green-100 text-green-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.start_time).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start_time) > now).slice(0, 5);
  };

  if (loading) {
    return <div className="text-center py-8">Loading calendar...</div>;
  }

  const groupedEvents = groupEventsByDate();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {userRole === 'supervisor' ? 'Event Management' : 'My Calendar'}
          </h2>
          <p className="text-muted-foreground">
            {userRole === 'supervisor' 
              ? 'Schedule and manage events for your team'
              : 'View your scheduled events and meetings'
            }
          </p>
        </div>
        
        {userRole === 'supervisor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Schedule a new event or meeting
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Event location (optional)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Attendees</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {interns.map((intern) => (
                      <label key={intern.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newEvent.attendees.includes(intern.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEvent({
                                ...newEvent,
                                attendees: [...newEvent.attendees, intern.id]
                              });
                            } else {
                              setNewEvent({
                                ...newEvent,
                                attendees: newEvent.attendees.filter(id => id !== intern.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{intern.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEvent}>
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <CardDescription>Next 5 events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const { date, time } = formatDateTime(event.start_time);
                  return (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {event.event_type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event List by Date */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Events</CardTitle>
              <CardDescription>Organized by date</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedEvents).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedEvents)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, dateEvents]) => (
                      <div key={date}>
                        <h3 className="font-semibold text-lg mb-3 pb-2 border-b">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="space-y-3">
                          {dateEvents.map((event) => {
                            const startTime = formatDateTime(event.start_time);
                            const endTime = formatDateTime(event.end_time);
                            
                            return (
                              <Card key={event.id} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <Badge className={getEventTypeColor(event.event_type)}>
                                      {event.event_type}
                                    </Badge>
                                  </div>
                                  
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {event.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {startTime.time} - {endTime.time}
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                      </div>
                                    )}
                                    {event.attendees.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {event.attendees.length} attendees
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No events scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;