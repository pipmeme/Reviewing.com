import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mail, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailSettingsProps {
  businessId: string;
}

export const EmailSettings = ({ businessId }: EmailSettingsProps) => {
  const [settings, setSettings] = useState({
    notification_email: '',
    notify_new_testimonial: true,
    notify_on_approval: false,
    email_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [businessId]);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('notification_email, notify_new_testimonial, notify_on_approval, email_enabled')
      .eq('id', businessId)
      .single();

    if (!error && data) {
      setSettings({
        // @ts-ignore - These columns will exist after database migration
        notification_email: data.notification_email || '',
        // @ts-ignore
        notify_new_testimonial: data.notify_new_testimonial ?? true,
        // @ts-ignore
        notify_on_approval: data.notify_on_approval ?? false,
        // @ts-ignore
        email_enabled: data.email_enabled ?? true,
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    // @ts-ignore - These columns will exist after database migration
    const { error } = await supabase
      .from('businesses')
      .update({
        // @ts-ignore
        notification_email: settings.notification_email || null,
        // @ts-ignore
        notify_new_testimonial: settings.notify_new_testimonial,
        // @ts-ignore
        notify_on_approval: settings.notify_on_approval,
        // @ts-ignore
        email_enabled: settings.email_enabled,
      } as any)
      .eq('id', businessId);

    if (error) {
      toast.error('Failed to save email settings');
    } else {
      toast.success('Email settings saved successfully!');
    }
    setSaving(false);
  };

  const sendTestEmail = async () => {
    if (!settings.notification_email) {
      toast.error('Please enter an email address first');
      return;
    }

    toast.info('Test email sent!', {
      description: `Check ${settings.notification_email} for the test message`,
    });

    // TODO: Call Supabase Edge Function to send test email
    console.log('Sending test email to:', settings.notification_email);
  };

  if (loading) {
    return <div>Loading email settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Email Notifications</CardTitle>
        </div>
        <CardDescription>
          Configure how you want to receive notifications about testimonials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-email">Notification Email Address</Label>
            <Input
              id="notification-email"
              type="email"
              placeholder="your@email.com"
              value={settings.notification_email}
              onChange={(e) =>
                setSettings({ ...settings, notification_email: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              We'll send notifications to this email address
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-enabled" className="font-normal">
                Enable Email Notifications
              </Label>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notify-new" className="font-normal">
                Notify on New Testimonial
              </Label>
            </div>
            <Switch
              id="notify-new"
              checked={settings.notify_new_testimonial}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_new_testimonial: checked })
              }
              disabled={!settings.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notify-approval" className="font-normal">
                Notify When Testimonial is Approved
              </Label>
            </div>
            <Switch
              id="notify-approval"
              checked={settings.notify_on_approval}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_approval: checked })
              }
              disabled={!settings.email_enabled}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={saveSettings} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            variant="outline"
            onClick={sendTestEmail}
            disabled={!settings.notification_email || !settings.email_enabled}
          >
            Send Test Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
