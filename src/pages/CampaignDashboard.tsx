import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Copy, 
  ArrowLeft,
  Settings,
  ExternalLink,
  TrendingUp,
  Users,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { TestimonialMediaManager } from "@/components/TestimonialMediaManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormBuilder } from "@/components/FormBuilder";

interface Campaign {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  custom_questions: { question: string; required: boolean }[];
  allow_video: boolean;
  allow_photo: boolean;
  allow_text: boolean;
  allow_rating: boolean;
  unique_slug: string;
  created_at: string;
  total_sent: number;
  total_submitted: number;
}

interface Testimonial {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  status: string;
  photo_url: string | null;
  created_at: string;
}

interface Business {
  id: string;
  business_name: string;
  user_id: string;
}

const CampaignDashboard = () => {
  const { campaignSlug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    allow_video: true,
    allow_photo: true,
    allow_text: true,
    allow_rating: true,
    custom_questions: [] as { question: string; required: boolean }[],
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, [campaignSlug]);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    loadCampaign();
  };

  const loadCampaign = async () => {
    if (!campaignSlug) return;

    setLoading(true);
    const { data: campaignData, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("unique_slug", campaignSlug)
      .single();

    if (error || !campaignData) {
      toast.error("Campaign not found");
      navigate("/dashboard");
      return;
    }

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", campaignData.business_id)
      .eq("user_id", user?.id)
      .single();

    if (!businessData) {
      toast.error("Unauthorized");
      navigate("/dashboard");
      return;
    }

    const parsedCampaign: Campaign = {
      ...campaignData,
      custom_questions: (campaignData.custom_questions as any) || [],
      allow_video: campaignData.allow_video ?? true,
      allow_photo: campaignData.allow_photo ?? true,
      allow_text: campaignData.allow_text ?? true,
      allow_rating: campaignData.allow_rating ?? true,
    };

    setCampaign(parsedCampaign);
    setBusiness(businessData);
    setEditForm({
      name: parsedCampaign.name,
      description: parsedCampaign.description || "",
      allow_video: parsedCampaign.allow_video,
      allow_photo: parsedCampaign.allow_photo,
      allow_text: parsedCampaign.allow_text,
      allow_rating: parsedCampaign.allow_rating,
      custom_questions: parsedCampaign.custom_questions,
    });

    loadTestimonials(parsedCampaign.id);
  };

  const loadTestimonials = async (campaignId: string) => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load testimonials");
    } else {
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update testimonial");
    } else {
      toast.success(`Testimonial ${status}!`);
      if (campaign) loadTestimonials(campaign.id);
    }
  };

  const copyLink = () => {
    if (campaign) {
      const link = `${window.location.origin}/submit/${campaign.unique_slug}`;
      navigator.clipboard.writeText(link);
      toast.success("Campaign link copied to clipboard!");
    }
  };

  const openLink = () => {
    if (campaign) {
      window.open(`${window.location.origin}/submit/${campaign.unique_slug}`, "_blank");
    }
  };

  const handleUpdateCampaign = async () => {
    if (!campaign) return;

    const { error } = await supabase
      .from("campaigns")
      .update({
        name: editForm.name,
        description: editForm.description || null,
        allow_video: editForm.allow_video,
        allow_photo: editForm.allow_photo,
        allow_text: editForm.allow_text,
        allow_rating: editForm.allow_rating,
        custom_questions: editForm.custom_questions,
      })
      .eq("id", campaign.id);

    if (error) {
      toast.error("Failed to update campaign");
    } else {
      toast.success("Campaign updated successfully!");
      setIsSettingsOpen(false);
      loadCampaign();
    }
  };

  const getStats = () => {
    const total = testimonials.length;
    const approved = testimonials.filter((t) => t.status === "approved").length;
    const pending = testimonials.filter((t) => t.status === "pending").length;
    const avgRating = testimonials.length
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : "0";

    return { total, approved, pending, avgRating };
  };

  if (loading || !campaign || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading campaign...</p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                <p className="text-sm text-muted-foreground">{business.business_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <Tabs defaultValue="testimonials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="testimonials" onClick={() => setShowFormBuilder(false)}>
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="form-builder" onClick={() => setShowFormBuilder(true)}>
              Form Builder
            </TabsTrigger>
          </TabsList>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Testimonials</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Users className="h-8 w-8 text-warning" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Campaign Link Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 mb-8">
          <h2 className="text-lg font-semibold mb-2">Campaign Submission Link</h2>
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-background rounded-md text-sm">
              {window.location.origin}/submit/{campaign.unique_slug}
            </code>
            <Button onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={openLink}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {campaign.description}
            </p>
          )}
        </Card>

        {/* Testimonials Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Testimonials</h2>
            <div className="flex gap-2">
              <Badge variant="outline">
                {stats.pending} Pending
              </Badge>
              <Badge variant="default">
                {stats.approved} Approved
              </Badge>
            </div>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No testimonials yet. Share your campaign link to start collecting!
              </p>
              <Button onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Campaign Link
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Testimonial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TestimonialMediaManager
                        testimonialId={testimonial.id}
                        customerName={testimonial.name}
                        onMediaUpdated={() => loadTestimonials(campaign.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-yellow-500 fill-yellow-500"
                            />
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{testimonial.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          testimonial.status === "approved"
                            ? "default"
                            : testimonial.status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {testimonial.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {testimonial.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateStatus(testimonial.id, "approved")
                            }
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        {testimonial.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateStatus(testimonial.id, "rejected")
                            }
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
          </TabsContent>

          {/* Form Builder Tab */}
          <TabsContent value="form-builder">
            <FormBuilder campaignId={campaign.id} onSave={() => loadCampaign()} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Campaign Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Settings</DialogTitle>
            <DialogDescription>
              Update your campaign configuration and custom questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="campaign-desc">Description</Label>
              <Textarea
                id="campaign-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <Label>Upload Options</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-text" className="font-normal">
                  Allow Text Testimonials
                </Label>
                <Switch
                  id="allow-text"
                  checked={editForm.allow_text}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_text: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-photo" className="font-normal">
                  Allow Photo Uploads
                </Label>
                <Switch
                  id="allow-photo"
                  checked={editForm.allow_photo}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_photo: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-video" className="font-normal">
                  Allow Video Uploads
                </Label>
                <Switch
                  id="allow-video"
                  checked={editForm.allow_video}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_video: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-rating" className="font-normal">
                  Allow Star Ratings
                </Label>
                <Switch
                  id="allow-rating"
                  checked={editForm.allow_rating}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_rating: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCampaign}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDashboard;
