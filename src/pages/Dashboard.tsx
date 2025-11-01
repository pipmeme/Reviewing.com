import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CSVUpload } from "@/components/CSVUpload";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignManager } from "@/components/CampaignManager";
import { LoadingPage } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Business {
  id: string;
  business_name: string;
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
  campaign_id: string | null;
}

interface Campaign {
  id: string;
  name: string;
  unique_slug: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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

    setUser(session.user);
    await loadBusiness(session.user.id);
    setLoading(false);
  };

  const loadBusiness = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      let { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!businessData) {
        const { data: newBusiness } = await supabase
          .from("businesses")
          .insert({
            user_id: userId,
            business_name: profile.name || "My Business",
          })
          .select()
          .single();
        businessData = newBusiness;
      }

      setBusiness(businessData);
      if (businessData) {
        loadTestimonials(businessData.id);
        loadCampaigns(businessData.id);
      }
    }
  };

  const loadCampaigns = async (businessId: string) => {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, unique_slug")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (data) {
      setCampaigns(data);
    }
  };

  const loadTestimonials = async (businessId: string) => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (data) {
      setTestimonials(data);
    }
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
      if (business) {
        loadTestimonials(business.id);
      }
    }
  };

  const copyLink = () => {
    if (business) {
      const link = `${window.location.origin}/submit/${business.id}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <LoadingPage text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 supports-[backdrop-filter]:backdrop-blur-md bg-background/70">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary fill-primary animate-float" />
            <span className="text-xl font-bold tracking-tight">Trustly</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="motion-lift">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="motion-lift">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your campaigns and collect testimonials
          </p>
        </div>

        <AnalyticsDashboard
          totalTestimonials={testimonials.length}
          pendingCount={testimonials.filter((t) => t.status === "pending").length}
          approvedCount={testimonials.filter((t) => t.status === "approved").length}
        />

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-xl">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="email-campaigns">Email Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            {business && <CampaignManager businessId={business.id} />}
          </TabsContent>

          <TabsContent value="email-campaigns">
            {business && (
              <CSVUpload
                businessId={business.id}
                onCampaignSent={() => {
                  if (business) loadTestimonials(business.id);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
