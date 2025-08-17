import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import InternDashboard from '@/components/dashboard/InternDashboard';
import { Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  role: string;
  full_name: string;
  email: string;
  department?: string;
  phone?: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Profile Setup Required</h2>
          <p className="text-muted-foreground">Please contact your administrator to set up your profile.</p>
        </div>
      </div>
    );
  }

  if (profile.role === 'supervisor') {
    return <SupervisorDashboard profile={profile} />;
  } else if (profile.role === 'intern') {
    return <InternDashboard profile={profile} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Invalid Role</h2>
        <p className="text-muted-foreground">Please contact your administrator.</p>
      </div>
    </div>
  );
};

export default Dashboard;