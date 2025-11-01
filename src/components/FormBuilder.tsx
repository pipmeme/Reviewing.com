import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Settings, Palette, Type, Layout, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FormBuilderProps {
  campaignId: string;
  onSave?: () => void;
}

interface FormField {
  enabled: boolean;
  required?: boolean;
  label: string;
  placeholder?: string;
}

interface FormConfig {
  fields: {
    name: FormField;
    email: FormField;
    rating: FormField;
    text: FormField;
    photo: FormField;
    video: FormField;
  };
  customization: {
    title: string;
    description: string;
    submitButtonText: string;
    successTitle: string;
    successMessage: string;
    ratingEmojis: Record<string, string>;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
    showLogo: boolean;
    showPoweredBy: boolean;
  };
}

const defaultConfig: FormConfig = {
  fields: {
    name: { enabled: true, required: true, label: 'Your Name', placeholder: 'John Doe' },
    email: { enabled: true, required: false, label: 'Email', placeholder: 'you@example.com' },
    rating: { enabled: true, required: true, label: 'How would you rate your experience?' },
    text: { enabled: true, required: false, label: 'Your Testimonial', placeholder: 'Share your experience...' },
    photo: { enabled: true, label: 'Add Photos' },
    video: { enabled: true, label: 'Add Video' },
  },
  customization: {
    title: '',
    description: '',
    submitButtonText: 'Submit Testimonial',
    successTitle: 'Thank You!',
    successMessage: 'Your testimonial has been submitted successfully and is awaiting approval.',
    ratingEmojis: {
      '1': '😞 Needs Improvement',
      '2': '😐 Fair',
      '3': '👍 Good!',
      '4': '😊 Great!',
      '5': '⭐ Excellent!'
    }
  },
  styling: {
    primaryColor: '#4FD1C5',
    secondaryColor: '#38B2AC',
    fontFamily: 'Inter',
    borderRadius: '12px',
    showLogo: true,
    showPoweredBy: true,
  }
};

export const FormBuilder = ({ campaignId, onSave }: FormBuilderProps) => {
  const [config, setConfig] = useState<FormConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [campaignId]);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('form_config')
      .eq('id', campaignId)
      .single();

    // @ts-ignore - form_config column will exist after database migration
    if (!error && data?.form_config) {
      // @ts-ignore
      setConfig({ ...defaultConfig, ...data.form_config });
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    // @ts-ignore - form_config column will exist after database migration
    const { error } = await supabase
      .from('campaigns')
      .update({ form_config: config } as any)
      .eq('id', campaignId);

    if (error) {
      toast.error('Failed to save form configuration');
    } else {
      toast.success('Form configuration saved successfully!');
      onSave?.();
    }
    setSaving(false);
  };

  const updateField = (fieldName: keyof FormConfig['fields'], updates: Partial<FormField>) => {
    setConfig({
      ...config,
      fields: {
        ...config.fields,
        [fieldName]: { ...config.fields[fieldName], ...updates }
      }
    });
  };

  if (loading) {
    return <div>Loading form builder...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Form Builder</h2>
          <p className="text-muted-foreground">Customize every aspect of your testimonial form</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* PREVIEW MODE */
        <Card className="p-8">
          <div 
            className="max-w-2xl mx-auto space-y-6"
            style={{
              fontFamily: config.styling.fontFamily,
              color: config.styling.primaryColor
            }}
          >
            {config.styling.showLogo && (
              <div className="text-center mb-6">
                <div className="h-16 w-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
                  LOGO
                </div>
              </div>
            )}
            
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2" style={{ color: config.styling.primaryColor }}>
                {config.customization.title || 'Share Your Experience'}
              </h1>
              <p className="text-muted-foreground">
                {config.customization.description || 'We value your feedback'}
              </p>
            </div>

            <div className="space-y-4">
              {config.fields.name.enabled && (
                <div>
                  <Label>{config.fields.name.label} {config.fields.name.required && '*'}</Label>
                  <Input placeholder={config.fields.name.placeholder} style={{ borderRadius: config.styling.borderRadius }} />
                </div>
              )}

              {config.fields.email.enabled && (
                <div>
                  <Label>{config.fields.email.label} {config.fields.email.required && '*'}</Label>
                  <Input placeholder={config.fields.email.placeholder} style={{ borderRadius: config.styling.borderRadius }} />
                </div>
              )}

              {config.fields.rating.enabled && (
                <div>
                  <Label>{config.fields.rating.label} {config.fields.rating.required && '*'}</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-xl">
                        ⭐
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.fields.text.enabled && (
                <div>
                  <Label>{config.fields.text.label} {config.fields.text.required && '*'}</Label>
                  <Textarea placeholder={config.fields.text.placeholder} style={{ borderRadius: config.styling.borderRadius }} />
                </div>
              )}

              {config.fields.photo.enabled && (
                <div>
                  <Label>{config.fields.photo.label}</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderRadius: config.styling.borderRadius }}>
                    <p className="text-sm text-muted-foreground">Upload photos</p>
                  </div>
                </div>
              )}

              {config.fields.video.enabled && (
                <div>
                  <Label>{config.fields.video.label}</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderRadius: config.styling.borderRadius }}>
                    <p className="text-sm text-muted-foreground">Upload video</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                style={{ 
                  background: `linear-gradient(135deg, ${config.styling.primaryColor} 0%, ${config.styling.secondaryColor} 100%)`,
                  borderRadius: config.styling.borderRadius
                }}
              >
                {config.customization.submitButtonText}
              </Button>

              {config.styling.showPoweredBy && (
                <p className="text-xs text-center text-muted-foreground">
                  Powered by <span style={{ color: config.styling.primaryColor }}>Trustly</span>
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* EDIT MODE */
        <Tabs defaultValue="fields" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fields">
              <Layout className="h-4 w-4 mr-2" />
              Fields
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="h-4 w-4 mr-2" />
              Text & Labels
            </TabsTrigger>
            <TabsTrigger value="styling">
              <Palette className="h-4 w-4 mr-2" />
              Styling
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Choose which fields to show and make them required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Field */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.fields.name.enabled}
                        onCheckedChange={(checked) => updateField('name', { enabled: checked })}
                      />
                      <Label className="font-semibold">Name Field</Label>
                    </div>
                    {config.fields.name.enabled && (
                      <div className="ml-12 flex items-center gap-2">
                        <Switch
                          checked={config.fields.name.required}
                          onCheckedChange={(checked) => updateField('name', { required: checked })}
                        />
                        <span className="text-sm text-muted-foreground">Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.fields.email.enabled}
                        onCheckedChange={(checked) => updateField('email', { enabled: checked })}
                      />
                      <Label className="font-semibold">Email Field</Label>
                    </div>
                    {config.fields.email.enabled && (
                      <div className="ml-12 flex items-center gap-2">
                        <Switch
                          checked={config.fields.email.required}
                          onCheckedChange={(checked) => updateField('email', { required: checked })}
                        />
                        <span className="text-sm text-muted-foreground">Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Field */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.fields.rating.enabled}
                        onCheckedChange={(checked) => updateField('rating', { enabled: checked })}
                      />
                      <Label className="font-semibold">Star Rating</Label>
                    </div>
                    {config.fields.rating.enabled && (
                      <div className="ml-12 flex items-center gap-2">
                        <Switch
                          checked={config.fields.rating.required}
                          onCheckedChange={(checked) => updateField('rating', { required: checked })}
                        />
                        <span className="text-sm text-muted-foreground">Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Field */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.fields.text.enabled}
                        onCheckedChange={(checked) => updateField('text', { enabled: checked })}
                      />
                      <Label className="font-semibold">Testimonial Text</Label>
                    </div>
                    {config.fields.text.enabled && (
                      <div className="ml-12 flex items-center gap-2">
                        <Switch
                          checked={config.fields.text.required}
                          onCheckedChange={(checked) => updateField('text', { required: checked })}
                        />
                        <span className="text-sm text-muted-foreground">Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.fields.photo.enabled}
                      onCheckedChange={(checked) => updateField('photo', { enabled: checked })}
                    />
                    <Label className="font-semibold">Photo Upload</Label>
                  </div>
                </div>

                {/* Video Upload */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.fields.video.enabled}
                      onCheckedChange={(checked) => updateField('video', { enabled: checked })}
                    />
                    <Label className="font-semibold">Video Upload</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text & Labels Tab */}
          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Text & Labels</CardTitle>
                <CardDescription>Customize every text shown on the form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Form Title</Label>
                  <Input
                    value={config.customization.title}
                    onChange={(e) => setConfig({
                      ...config,
                      customization: { ...config.customization, title: e.target.value }
                    })}
                    placeholder="Share Your Experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Form Description</Label>
                  <Textarea
                    value={config.customization.description}
                    onChange={(e) => setConfig({
                      ...config,
                      customization: { ...config.customization, description: e.target.value }
                    })}
                    placeholder="We value your feedback"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name Label</Label>
                    <Input
                      value={config.fields.name.label}
                      onChange={(e) => updateField('name', { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name Placeholder</Label>
                    <Input
                      value={config.fields.name.placeholder}
                      onChange={(e) => updateField('name', { placeholder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Label</Label>
                    <Input
                      value={config.fields.email.label}
                      onChange={(e) => updateField('email', { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Placeholder</Label>
                    <Input
                      value={config.fields.email.placeholder}
                      onChange={(e) => updateField('email', { placeholder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rating Label</Label>
                  <Input
                    value={config.fields.rating.label}
                    onChange={(e) => updateField('rating', { label: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Testimonial Label</Label>
                    <Input
                      value={config.fields.text.label}
                      onChange={(e) => updateField('text', { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Testimonial Placeholder</Label>
                    <Input
                      value={config.fields.text.placeholder}
                      onChange={(e) => updateField('text', { placeholder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Submit Button Text</Label>
                  <Input
                    value={config.customization.submitButtonText}
                    onChange={(e) => setConfig({
                      ...config,
                      customization: { ...config.customization, submitButtonText: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Success Title</Label>
                  <Input
                    value={config.customization.successTitle}
                    onChange={(e) => setConfig({
                      ...config,
                      customization: { ...config.customization, successTitle: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Success Message</Label>
                  <Textarea
                    value={config.customization.successMessage}
                    onChange={(e) => setConfig({
                      ...config,
                      customization: { ...config.customization, successMessage: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Styling Tab */}
          <TabsContent value="styling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visual Styling</CardTitle>
                <CardDescription>Customize colors, fonts, and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.styling.primaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          styling: { ...config.styling, primaryColor: e.target.value }
                        })}
                        className="w-20"
                      />
                      <Input
                        value={config.styling.primaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          styling: { ...config.styling, primaryColor: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.styling.secondaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          styling: { ...config.styling, secondaryColor: e.target.value }
                        })}
                        className="w-20"
                      />
                      <Input
                        value={config.styling.secondaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          styling: { ...config.styling, secondaryColor: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={config.styling.fontFamily}
                    onValueChange={(value) => setConfig({
                      ...config,
                      styling: { ...config.styling, fontFamily: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Select
                    value={config.styling.borderRadius}
                    onValueChange={(value) => setConfig({
                      ...config,
                      styling: { ...config.styling, borderRadius: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">Sharp (0px)</SelectItem>
                      <SelectItem value="4px">Small (4px)</SelectItem>
                      <SelectItem value="8px">Medium (8px)</SelectItem>
                      <SelectItem value="12px">Large (12px)</SelectItem>
                      <SelectItem value="20px">Extra Large (20px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Logo</Label>
                  <Switch
                    checked={config.styling.showLogo}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      styling: { ...config.styling, showLogo: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show "Powered by Trustly"</Label>
                  <Switch
                    checked={config.styling.showPoweredBy}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      styling: { ...config.styling, showPoweredBy: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Rating emojis and other advanced options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="space-y-2">
                    <Label>{rating} Star Feedback</Label>
                    <Input
                      value={config.customization.ratingEmojis[rating.toString()]}
                      onChange={(e) => setConfig({
                        ...config,
                        customization: {
                          ...config.customization,
                          ratingEmojis: {
                            ...config.customization.ratingEmojis,
                            [rating.toString()]: e.target.value
                          }
                        }
                      })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
