import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Palette, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BrandingSettingsProps {
  businessId: string;
}

export const BrandingSettings = ({ businessId }: BrandingSettingsProps) => {
  const [settings, setSettings] = useState({
    primary_color: '#4FD1C5',
    secondary_color: '#38B2AC',
    custom_logo_url: '',
    show_branding: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [businessId]);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('brand_color, custom_logo_url, show_branding, custom_colors')
      .eq('id', businessId)
      .single();

    if (!error && data) {
      // @ts-ignore - These columns will exist after database migration
      const colors = data.custom_colors as any || {};
      setSettings({
        // @ts-ignore
        primary_color: colors.primary || data.brand_color || '#4FD1C5',
        secondary_color: colors.secondary || '#38B2AC',
        // @ts-ignore
        custom_logo_url: data.custom_logo_url || '',
        // @ts-ignore
        show_branding: data.show_branding ?? true,
      });
    }
    setLoading(false);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${businessId}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(uploadData.path);

      setSettings({ ...settings, custom_logo_url: publicUrl });
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      toast.error(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({
        brand_color: settings.primary_color,
        custom_logo_url: settings.custom_logo_url || null,
        show_branding: settings.show_branding,
        custom_colors: {
          primary: settings.primary_color,
          secondary: settings.secondary_color,
        },
      })
      .eq('id', businessId);

    if (error) {
      toast.error('Failed to save branding settings');
    } else {
      toast.success('Branding settings saved successfully!');
    }
    setSaving(false);
  };

  const resetToDefaults = () => {
    setSettings({
      primary_color: '#4FD1C5',
      secondary_color: '#38B2AC',
      custom_logo_url: '',
      show_branding: true,
    });
    toast.info('Reset to default branding');
  };

  if (loading) {
    return <div>Loading branding settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Branding & Customization</CardTitle>
        </div>
        <CardDescription>
          Customize the look and feel of your testimonial forms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Settings */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#4FD1C5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_color: e.target.value })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_color: e.target.value })
                  }
                  className="flex-1"
                  placeholder="#38B2AC"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Custom Logo</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Button
                onClick={handleLogoUpload}
                disabled={!logoFile || uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            {settings.custom_logo_url && (
              <div className="mt-2 p-4 border rounded-md bg-muted/50">
                <img
                  src={settings.custom_logo_url}
                  alt="Logo preview"
                  className="h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Show Branding Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="show-branding" className="font-normal">
                Show "Powered by Trustly" Branding
              </Label>
              <p className="text-xs text-muted-foreground">
                Display branding on your testimonial forms
              </p>
            </div>
            <Switch
              id="show-branding"
              checked={settings.show_branding}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_branding: checked })
              }
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label>Preview</Label>
          </div>
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: settings.primary_color + '10',
              borderColor: settings.primary_color,
            }}
          >
            {settings.custom_logo_url && (
              <img
                src={settings.custom_logo_url}
                alt="Logo"
                className="h-12 object-contain mb-4"
              />
            )}
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: settings.primary_color }}
            >
              Share Your Experience
            </h3>
            <div className="space-y-2">
              <div
                className="h-10 rounded-md"
                style={{ backgroundColor: settings.secondary_color + '20' }}
              />
              <div
                className="h-24 rounded-md"
                style={{ backgroundColor: settings.secondary_color + '20' }}
              />
              <button
                className="w-full py-2 px-4 rounded-md text-white font-medium"
                style={{ backgroundColor: settings.primary_color }}
              >
                Submit Testimonial
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={saveSettings} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
