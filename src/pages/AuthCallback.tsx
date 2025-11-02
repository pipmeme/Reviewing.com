import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingPage } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (!code) {
          toast.error('Missing auth code in callback');
          navigate('/auth');
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message);
          navigate('/auth');
          return;
        }
        toast.success('You are signed in');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err?.message || 'Auth callback failed');
        navigate('/auth');
      }
    };
    handleCallback();
  }, [navigate]);

  return <LoadingPage text="Finalizing sign in..." />;
};

export default AuthCallback;

