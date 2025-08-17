import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        data: params.data,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Notification templates for different events
export const notificationTemplates = {
  taskAssigned: (taskTitle: string) => ({
    title: 'New Task Assigned',
    message: `You have been assigned a new task: "${taskTitle}"`,
    type: 'info' as const,
  }),
  
  taskCompleted: (taskTitle: string, internName: string) => ({
    title: 'Task Completed',
    message: `${internName} has completed the task: "${taskTitle}"`,
    type: 'success' as const,
  }),
  
  feedbackReceived: (supervisorName: string) => ({
    title: 'New Feedback',
    message: `You have received new feedback from ${supervisorName}`,
    type: 'info' as const,
  }),
  
  certificateIssued: (certificateName: string) => ({
    title: 'Certificate Issued',
    message: `Congratulations! You have received a certificate for: "${certificateName}"`,
    type: 'success' as const,
  }),
  
  eventCreated: (eventTitle: string) => ({
    title: 'New Event',
    message: `You have been invited to: "${eventTitle}"`,
    type: 'info' as const,
  }),
  
  attendanceReminder: () => ({
    title: 'Attendance Reminder',
    message: 'Don\'t forget to mark your attendance for today!',
    type: 'warning' as const,
  }),
};

// Enhanced notification system for comprehensive real-time updates
export const sendEventNotification = async (eventData: any, attendeeIds: string[]) => {
  const template = notificationTemplates.eventCreated(eventData.title);
  await notifyMultipleUsers(attendeeIds, template, { 
    eventId: eventData.id,
    eventStart: eventData.start_time,
    eventLocation: eventData.location 
  });
};

export const sendAttendanceReminder = async (userIds: string[]) => {
  const template = notificationTemplates.attendanceReminder();
  await notifyMultipleUsers(userIds, template);
};

export const sendNewMessageNotification = async (senderId: string, receiverId: string, senderName: string) => {
  await createNotification({
    userId: receiverId,
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    type: 'info',
    data: { senderId }
  });
};

export const sendFeedbackNotification = async (internId: string, supervisorName: string, feedbackType: string) => {
  const template = notificationTemplates.feedbackReceived(supervisorName);
  await createNotification({
    userId: internId,
    ...template,
    data: { feedbackType }
  });
};

// Helper function to notify multiple users
export const notifyMultipleUsers = async (
  userIds: string[],
  template: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' },
  data?: any
) => {
  const promises = userIds.map(userId =>
    createNotification({
      userId,
      ...template,
      data,
    })
  );

  await Promise.all(promises);
};