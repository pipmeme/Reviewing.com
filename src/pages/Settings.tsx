import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ArrowLeft, Copy, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EmailSettings } from "@/components/EmailSettings";
import { BrandingSettings } from "@/components/BrandingSettings";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Business {
  id: string;
  business_name: string;
  brand_color: string;
  logo_url?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    brand_color: "#14b8a6",
    logo_url: "",
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (businessData) {
      setBusiness(businessData);
      setFormData({
        business_name: businessData.business_name,
        brand_color: businessData.brand_color,
        logo_url: businessData.logo_url || "",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!business) return;

    const { error } = await supabase
      .from("businesses")
      .update({
        business_name: formData.business_name,
        brand_color: formData.brand_color,
        logo_url: formData.logo_url || null,
      })
      .eq("id", business.id);

    if (error) {
      toast.error("Failed to update settings");
    } else {
      toast.success("Settings updated successfully!");
    }

    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${business.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('testimonial-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('testimonial-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: data.publicUrl });
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      toast.error(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const copyWidgetCode = () => {
    if (!business) return;
    
    const widgetCode = `<script src="${window.location.origin}/widget.js" data-business-id="${business.id}"></script>`;
    navigator.clipboard.writeText(widgetCode);
    toast.success("Widget code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 supports-[backdrop-filter]:backdrop-blur-md bg-background/70">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="motion-lift">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary fill-primary animate-float" />
            <span className="text-xl font-bold tracking-tight">Trustly</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your testimonial platform
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <form onSubmit={handleUpdate} className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>

                <div className="space-y-4">
                  {/* Logo Upload */}
                  <div>
                    <Label>Company Logo</Label>
                    <div className="mt-2 space-y-3">
                      {formData.logo_url && (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          <img 
                            src={formData.logo_url} 
                            alt="Company logo" 
                            className="h-12 w-auto object-contain"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ ...formData, logo_url: "" })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {uploading ? "Uploading..." : formData.logo_url ? "Change Logo" : "Upload Logo"}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({ ...formData, business_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand_color">Brand Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand_color"
                        type="color"
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData({ ...formData, brand_color: e.target.value })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData({ ...formData, brand_color: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </Card>
            </form>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Widget Code</h2>
              <p className="text-muted-foreground mb-4">
                Add this code to your website to display approved testimonials
              </p>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                  {`<script src="${window.location.origin}/widget.js" data-business-id="${business?.id}"></script>`}
                </code>
                <Button onClick={copyWidgetCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {business && <EmailSettings businessId={business.id} />}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {business && <AdvancedAnalytics businessId={business.id} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
