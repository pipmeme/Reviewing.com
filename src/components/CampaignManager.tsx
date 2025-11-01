import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Pencil, Trash2, ExternalLink, X, BarChart3, Video } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Campaign {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  welcome_video_url: string | null;
  video_autoplay: boolean;
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

interface CampaignManagerProps {
  businessId: string;
}

export const CampaignManager = ({ businessId }: CampaignManagerProps) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    welcome_video_url: "",
    video_autoplay: true,
    allow_video: true,
    allow_photo: true,
    allow_text: true,
    allow_rating: true,
    custom_questions: [] as { question: string; required: boolean }[],
  });
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, [businessId]);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load campaigns");
    } else {
      const parsedCampaigns: Campaign[] = (data || []).map(campaign => ({
        ...campaign,
        custom_questions: (campaign.custom_questions as any) || [],
        allow_video: campaign.allow_video ?? true,
        allow_photo: campaign.allow_photo ?? true,
        allow_text: campaign.allow_text ?? true,
        allow_rating: campaign.allow_rating ?? true,
        unique_slug: campaign.unique_slug || '',
        description: campaign.description,
        welcome_video_url: (campaign as any).welcome_video_url || null,
        video_autoplay: (campaign as any).video_autoplay ?? true,
      }));
      setCampaigns(parsedCampaigns);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      welcome_video_url: "",
      video_autoplay: true,
      allow_video: true,
      allow_photo: true,
      allow_text: true,
      allow_rating: true,
      custom_questions: [],
    });
    setNewQuestion("");
    setNewQuestionRequired(true);
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      welcome_video_url: campaign.welcome_video_url || "",
      video_autoplay: campaign.video_autoplay ?? true,
      allow_video: campaign.allow_video,
      allow_photo: campaign.allow_photo,
      allow_text: campaign.allow_text,
      allow_rating: campaign.allow_rating,
      custom_questions: campaign.custom_questions || [],
    });
    setIsDialogOpen(true);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setFormData({
      ...formData,
      custom_questions: [
        ...formData.custom_questions,
        { question: newQuestion.trim(), required: newQuestionRequired },
      ],
    });
    setNewQuestion("");
    setNewQuestionRequired(true);
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData({
      ...formData,
      custom_questions: formData.custom_questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    const campaignData = {
      business_id: businessId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      welcome_video_url: formData.welcome_video_url.trim() || null,
      allow_video: formData.allow_video,
      allow_photo: formData.allow_photo,
      allow_text: formData.allow_text,
      allow_rating: formData.allow_rating,
      custom_questions: formData.custom_questions,
    };

    console.log("Saving campaign with data:", campaignData); // DEBUG

    if (editingCampaign) {
      const { error } = await supabase
        .from("campaigns")
        .update(campaignData)
        .eq("id", editingCampaign.id);

      if (error) {
        console.error("Campaign update error:", error); // DEBUG
        toast.error("Failed to update campaign: " + error.message);
      } else {
        toast.success("Campaign updated successfully!");
        setIsDialogOpen(false);
        resetForm();
        loadCampaigns();
      }
    } else {
      const { error } = await supabase.from("campaigns").insert(campaignData);

      if (error) {
        console.error("Campaign insert error:", error); // DEBUG
        toast.error("Failed to create campaign: " + error.message);
      } else {
        toast.success("Campaign created successfully!");
        setIsDialogOpen(false);
        resetForm();
        loadCampaigns();
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete campaign");
    } else {
      toast.success("Campaign deleted successfully!");
      loadCampaigns();
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/submit/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Campaign link copied to clipboard!");
  };

  const openLink = (slug: string) => {
    window.open(`${window.location.origin}/submit/${slug}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">
            Create custom feedback forms for different products or purposes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
              </DialogTitle>
              <DialogDescription>
                Set up a custom feedback or testimonial form with your own questions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Product A Testimonials, Customer Feedback Survey"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this campaign is for"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Welcome Video (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
                  {formData.welcome_video_url ? (
                    <div className="space-y-3">
                      <video 
                        src={formData.welcome_video_url} 
                        controls 
                        className="w-full rounded-lg max-h-64"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, welcome_video_url: "" })}
                      >
                        Remove Video
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Click to upload welcome video</span>
                      <span className="text-xs text-muted-foreground">
                        MP4, WebM, or MOV (max 50MB)
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > 50 * 1024 * 1024) {
                            toast.error("Video must be less than 50MB");
                            return;
                          }

                          toast.loading("Uploading video...");

                          const fileExt = file.name.split('.').pop();
                          const fileName = `${businessId}-${Date.now()}.${fileExt}`;
                          const filePath = `welcome-videos/${fileName}`;

                          const { error: uploadError } = await supabase.storage
                            .from('testimonial-videos')
                            .upload(filePath, file);

                          if (uploadError) {
                            toast.error("Failed to upload video");
                            return;
                          }

                          const { data } = supabase.storage
                            .from('testimonial-videos')
                            .getPublicUrl(filePath);

                          setFormData({ ...formData, welcome_video_url: data.publicUrl });
                          toast.success("Video uploaded successfully!");
                        }}
                      />
                    </label>
                  )}
                </div>
                
                {/* Autoplay Toggle */}
                {formData.welcome_video_url && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mt-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Video Autoplay</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formData.video_autoplay 
                          ? "Video will start playing automatically when form opens (muted)" 
                          : "Users must click play button to start video"}
                      </p>
                    </div>
                    <Switch
                      checked={formData.video_autoplay}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, video_autoplay: checked })
                      }
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  📹 Upload a personal video that will {formData.video_autoplay ? 'autoplay' : 'be available'} when customers open the feedback form.
                  Say "Hi, thank you for your purchase! We'd love your feedback!"
                </p>
              </div>

              <div className="space-y-3">
                <Label>Upload Options</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_text" className="font-normal">
                      Allow Text Testimonials
                    </Label>
                    <Switch
                      id="allow_text"
                      checked={formData.allow_text}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allow_text: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_photo" className="font-normal">
                      Allow Photo Uploads
                    </Label>
                    <Switch
                      id="allow_photo"
                      checked={formData.allow_photo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allow_photo: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_video" className="font-normal">
                      Allow Video Uploads
                    </Label>
                    <Switch
                      id="allow_video"
                      checked={formData.allow_video}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allow_video: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_rating" className="font-normal">
                      Allow Star Ratings
                    </Label>
                    <Switch
                      id="allow_rating"
                      checked={formData.allow_rating}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allow_rating: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Custom Questions</Label>
                <div className="space-y-2">
                  {formData.custom_questions.map((q, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm">{q.question}</p>
                        {q.required && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Required
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter a custom question"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="required" className="text-sm whitespace-nowrap">
                      Required
                    </Label>
                    <Switch
                      id="required"
                      checked={newQuestionRequired}
                      onCheckedChange={setNewQuestionRequired}
                    />
                  </div>
                  <Button type="button" onClick={handleAddQuestion} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCampaign ? "Update Campaign" : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading campaigns...</p>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No campaigns yet. Create your first campaign to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {campaign.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {campaign.custom_questions?.length || 0} custom
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {campaign.allow_text && (
                        <Badge variant="secondary" className="text-xs">
                          Text
                        </Badge>
                      )}
                      {campaign.allow_photo && (
                        <Badge variant="secondary" className="text-xs">
                          Photo
                        </Badge>
                      )}
                      {campaign.allow_video && (
                        <Badge variant="secondary" className="text-xs">
                          Video
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      /{campaign.unique_slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/campaign/${campaign.unique_slug}`)}
                        title="View campaign dashboard"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLink(campaign.unique_slug)}
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(campaign.unique_slug)}
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(campaign)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(campaign.id, campaign.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
