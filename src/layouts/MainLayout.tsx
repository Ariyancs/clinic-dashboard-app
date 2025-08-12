import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

type UserProfile = { full_name: string; role: string; };

export default function MainLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', session.user.id).single();
        setUserProfile(profile);
      } else {
        setIsAuthenticated(false);
      }
    };
    
    fetchSessionAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) setUserProfile(null);
      else fetchSessionAndProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={userProfile} />
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}