import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailNotificationSettings {
  enabled: boolean;
  notifyOnNewTestimonial: boolean;
  notifyOnApproval: boolean;
  emailAddress?: string;
}

export const useEmailNotifications = (businessId: string, settings?: EmailNotificationSettings) => {
  useEffect(() => {
    if (!settings?.enabled) return;

    // Listen for new testimonials
    const channel = supabase
      .channel(`testimonials-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'testimonials',
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          const testimonial = payload.new;
          
          if (settings.notifyOnNewTestimonial) {
            // Show in-app notification
            toast.success(`New testimonial from ${testimonial.name}`, {
              description: 'Click to view in dashboard',
              duration: 10000,
            });

            // TODO: Send email notification via Supabase Edge Function
            // This would call your email service (SendGrid, Mailgun, etc.)
            console.log('Email notification:', {
              to: settings.emailAddress,
              subject: `New Testimonial from ${testimonial.name}`,
              testimonial
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'testimonials',
          filter: `business_id=eq.${businessId}`
        },
        async (payload) => {
          const testimonial = payload.new;
          
          if (settings.notifyOnApproval && testimonial.status === 'approved') {
            toast.success(`Testimonial approved`, {
              description: `${testimonial.name}'s testimonial is now live`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, settings]);
};
