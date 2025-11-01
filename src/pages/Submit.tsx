import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, XCircle, Upload, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import DOMPurify from "dompurify";
import { LoadingPage } from "@/components/LoadingSpinner";

// Sanitization function
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

// Enhanced validation schema
const testimonialSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Invalid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  rating: z.number().min(1, "Please select a rating").max(5),
  text: z.string().max(2000, "Text must be less than 2000 characters").optional().or(z.literal("")),
  customAnswers: z.record(z.string().max(1000, "Answer must be less than 1000 characters")).optional(),
});

interface Business {
  id: string;
  business_name: string;
  logo_url: string | null;
  brand_color: string;
  custom_colors?: { primary?: string; secondary?: string };
  custom_logo_url?: string | null;
  show_branding?: boolean;
}

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
}

const Submit = () => {
  const { businessId, campaignSlug } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recipientToken, setRecipientToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 0,
    text: "",
    photos: [] as File[],
    videos: [] as File[],
    customAnswers: {} as Record<string, string>,
  });
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Auto-play video with sound after 3 seconds
  useEffect(() => {
    if (campaign?.welcome_video_url && campaign?.video_autoplay) {
      const timer = setTimeout(() => {
        const video = document.getElementById('welcome-video') as HTMLVideoElement;
        if (video) {
          video.muted = false;
          video.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(err => {
            // If browser blocks autoplay with sound, play muted
            console.log('Autoplay with sound blocked, playing muted:', err);
            video.muted = true;
            video.play().then(() => {
              setIsVideoPlaying(true);
            });
          });
        }
      }, 3000); // 3 seconds delay

      return () => clearTimeout(timer);
    }
  }, [campaign]);

  useEffect(() => {
    if (campaignSlug) {
      loadCampaign();
    } else if (businessId) {
      loadBusiness();
    }
    // Check for token in URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");
    if (token) {
      setRecipientToken(token);
      loadRecipientData(token);
    }
  }, [businessId, campaignSlug]);

  const loadCampaign = async () => {
    if (!campaignSlug) return;

    console.log("Loading campaign with slug:", campaignSlug); // DEBUG

    const { data: campaignData, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("unique_slug", campaignSlug)
      .single();

    console.log("Campaign data:", campaignData, "Error:", error); // DEBUG

    if (error || !campaignData) {
      console.error("Campaign load error:", error); // DEBUG
      toast.error("Campaign not found");
      navigate("/");
      return;
    }

    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", campaignData.business_id)
      .single();

    console.log("Business data:", businessData); // DEBUG

    const campaignWithParsedData: Campaign = {
      ...campaignData,
      custom_questions: (campaignData.custom_questions as any) || [],
      welcome_video_url: (campaignData as any).welcome_video_url || null,
      video_autoplay: (campaignData as any).video_autoplay ?? true,
      allow_video: campaignData.allow_video ?? true,
      allow_photo: campaignData.allow_photo ?? true,
      allow_text: campaignData.allow_text ?? true,
      allow_rating: campaignData.allow_rating ?? true,
      unique_slug: campaignData.unique_slug || '',
      description: campaignData.description,
    };

    console.log("Loaded campaign data:", campaignWithParsedData); // DEBUG
    console.log("Custom questions:", campaignWithParsedData.custom_questions); // DEBUG

    setCampaign(campaignWithParsedData);
    setBusiness(businessData);
  };

  const loadBusiness = async () => {
    if (!businessId) return;

    const { data, error } = await supabase
      .from("businesses")
      .select("*, custom_colors, custom_logo_url, show_branding")
      .eq("id", businessId)
      .single();

    if (error || !data) {
      toast.error("Business not found");
      navigate("/");
      return;
    }

    setBusiness(data as any);
    
    // Apply custom branding colors to CSS variables
    // @ts-ignore - These columns will exist after database migration
    if (data.custom_colors) {
      // @ts-ignore
      const colors = data.custom_colors as any;
      if (colors.primary) {
        document.documentElement.style.setProperty('--brand-primary', colors.primary);
      }
      if (colors.secondary) {
        document.documentElement.style.setProperty('--brand-secondary', colors.secondary);
      }
    // @ts-ignore
    } else if (data.brand_color) {
      // @ts-ignore
      document.documentElement.style.setProperty('--brand-primary', data.brand_color);
    }
  };

  const loadRecipientData = async (token: string) => {
    const { data, error } = await supabase
      .from("campaign_recipients")
      .select("*")
      .eq("unique_token", token)
      .single();

    if (!error && data) {
      setFormData((prev) => ({
        ...prev,
        name: data.customer_name,
        email: data.customer_email,
      }));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
    setPhotoPreviewUrls(newPreviews);
    // Revoke the removed preview URL
    URL.revokeObjectURL(photoPreviewUrls[index]);
  };

  const removeVideo = (index: number) => {
    const newVideos = formData.videos.filter((_, i) => i !== index);
    const newPreviews = videoPreviewUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, videos: newVideos });
    setVideoPreviewUrls(newPreviews);
    // Revoke the removed preview URL
    URL.revokeObjectURL(videoPreviewUrls[index]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, photos: [...formData.photos, ...files] });
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, videos: [...formData.videos, ...files] });
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setVideoPreviewUrls([...videoPreviewUrls, ...newPreviewUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if rating is selected
      if (formData.rating === 0) {
        toast.error("Please select a rating");
        setLoading(false);
        return;
      }

      // Sanitize all inputs
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        email: formData.email ? sanitizeInput(formData.email) : "",
        rating: formData.rating,
        text: formData.text ? sanitizeInput(formData.text) : "",
        customAnswers: Object.fromEntries(
          Object.entries(formData.customAnswers).map(([key, value]) => [
            key,
            typeof value === 'string' ? sanitizeInput(value) : value
          ])
        )
      };

      // Basic validation
      if (!sanitizedData.name || sanitizedData.name.length < 2) {
        toast.error("Please enter your name (at least 2 characters)");
        setLoading(false);
        return;
      }

      if (sanitizedData.email && !sanitizedData.email.includes('@')) {
        toast.error("Please enter a valid email address");
        setLoading(false);
        return;
      }

      console.log("Submitting testimonial:", sanitizedData); // DEBUG

      // Check for duplicate submissions (rate limiting)
      if (sanitizedData.email) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentSubmissions } = await supabase
          .from('testimonials')
          .select('created_at')
          .eq('email', sanitizedData.email)
          .gte('created_at', fiveMinutesAgo);

        if (recentSubmissions && recentSubmissions.length > 0) {
          toast.error('Please wait a few minutes before submitting another testimonial');
          setLoading(false);
          return;
        }
      }

      // First insert the testimonial
      console.log("Inserting testimonial with data:", {
        business_id: campaign ? campaign.business_id : businessId,
        campaign_id: campaign ? campaign.id : null,
        name: sanitizedData.name,
        email: sanitizedData.email || null,
        rating: sanitizedData.rating,
        text: sanitizedData.text,
        custom_answers: sanitizedData.customAnswers,
      }); // DEBUG
      
      const { data: testimonialData, error: testimonialError } = await supabase
        .from("testimonials")
        .insert({
          business_id: campaign ? campaign.business_id : businessId,
          campaign_id: campaign ? campaign.id : null,
          name: sanitizedData.name,
          email: sanitizedData.email || null,
          rating: sanitizedData.rating,
          text: sanitizedData.text,
          custom_answers: sanitizedData.customAnswers,
        })
        .select()
        .single();

      if (testimonialError) {
        console.error("Testimonial insert error:", testimonialError);
        console.error("Error details:", JSON.stringify(testimonialError, null, 2)); // DEBUG
        toast.error(`Failed to submit testimonial: ${testimonialError.message}`);
        setLoading(false);
        return;
      }

      // Upload photos
      if (formData.photos.length > 0) {
        for (const photo of formData.photos) {
          try {
            const fileExt = photo.name.split(".").pop();
            const fileName = `${testimonialData.id}/${Math.random()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("testimonial-photos")
              .upload(fileName, photo, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              console.error("Photo upload error:", uploadError);
              throw uploadError;
            }

            if (uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from("testimonial-photos")
                .getPublicUrl(uploadData.path);

              const { error: insertError } = await supabase.from("testimonial_photos").insert({
                testimonial_id: testimonialData.id,
                photo_url: publicUrl,
              });

              if (insertError) {
                console.error("Photo insert error:", insertError);
                throw insertError;
              }
            }
          } catch (photoError: any) {
            console.error("Photo processing error:", photoError);
            toast.error(`Failed to upload photo: ${photoError.message}`);
          }
        }
      }

      // Upload videos
      if (formData.videos.length > 0) {
        for (const video of formData.videos) {
          try {
            const fileExt = video.name.split(".").pop();
            const fileName = `${testimonialData.id}/${Math.random()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("testimonial-videos")
              .upload(fileName, video, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              console.error("Video upload error:", uploadError);
              throw uploadError;
            }

            if (uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from("testimonial-videos")
                .getPublicUrl(uploadData.path);

              const { error: insertError } = await supabase.from("testimonial_videos").insert({
                testimonial_id: testimonialData.id,
                video_url: publicUrl,
              });

              if (insertError) {
                console.error("Video insert error:", insertError);
                throw insertError;
              }
            }
          } catch (videoError: any) {
            console.error("Video processing error:", videoError);
            toast.error(`Failed to upload video: ${videoError.message}`);
          }
        }
      }
        // Update recipient status if token exists
        if (recipientToken) {
          await supabase
            .from("campaign_recipients")
            .update({
              status: "submitted",
              submitted_at: new Date().toISOString(),
            })
            .eq("unique_token", recipientToken);

          // Update campaign stats
          const { data: recipient } = await supabase
            .from("campaign_recipients")
            .select("campaign_id")
            .eq("unique_token", recipientToken)
            .single();

          if (recipient) {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("total_submitted")
              .eq("id", recipient.campaign_id)
              .single();

            if (campaign) {
              await supabase
                .from("campaigns")
                .update({ total_submitted: (campaign.total_submitted || 0) + 1 })
                .eq("id", recipient.campaign_id);
            }
          }
        }
        setSubmitted(true);
        toast.success("Thank you for your testimonial!");
        
        // Clean up preview URLs
        photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        videoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    } catch (error: any) {
      console.error("Submission error:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to submit testimonial. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return <LoadingPage text="Loading testimonial form..." />;
  }

  if (submitted) {
    const brandPrimary = business.custom_colors?.primary || business.brand_color || '#4FD1C5';
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brandPrimary}15 0%, transparent 50%, ${brandPrimary}10 100%)`
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10" 
               style={{ background: brandPrimary, filter: 'blur(100px)' }}></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10" 
               style={{ background: brandPrimary, filter: 'blur(120px)' }}></div>
        </div>

        <Card className="w-full max-w-lg relative z-10 border-2 shadow-2xl backdrop-blur-sm bg-background/95">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6"
                 style={{ backgroundColor: `${brandPrimary}20` }}>
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: brandPrimary }} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: brandPrimary }}>
              Thank You!
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Your testimonial has been submitted successfully and is awaiting approval.
            </p>
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                {business.business_name} appreciates your valuable feedback!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // @ts-ignore - These properties will exist after database migration
  const brandPrimary = business.custom_colors?.primary || business.brand_color || '#4FD1C5';
  // @ts-ignore
  const brandSecondary = business.custom_colors?.secondary || '#38B2AC';
  // @ts-ignore
  const logoUrl = business.custom_logo_url || business.logo_url;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* Main Card */}
      <Card className="w-full max-w-2xl shadow-xl bg-white">
        <CardContent className="pt-6 sm:pt-10 md:pt-12 px-4 sm:px-8 md:px-12 pb-6 sm:pb-10">
          {/* Business Logo and Name Header */}
          <div className="text-center mb-4 sm:mb-6">
            {logoUrl && (
              <div className="flex justify-center mb-3 sm:mb-4">
                <img 
                  src={logoUrl} 
                  alt={business?.business_name || "Company logo"} 
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain max-w-[200px]"
                />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 px-2">
              {business?.business_name || campaign?.name || "Feedback Form"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2 px-2">
              {campaign?.description || "Help us improve with your valuable feedback."}
            </p>
          </div>

          {/* Welcome Video with Play Button Overlay */}
          {campaign?.welcome_video_url && (
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-lg sm:shadow-xl bg-gray-200 group">
                <video 
                  id="welcome-video"
                  className="w-full aspect-video object-cover" 
                  loop
                  playsInline
                  src={campaign.welcome_video_url}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Play/Pause Button Overlay - Always visible on mobile when paused */}
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                  style={{
                    opacity: isVideoPlaying ? 0 : 1,
                    background: isVideoPlaying ? 'transparent' : 'rgba(0,0,0,0.2)'
                  }}
                  onClick={() => {
                    const video = document.getElementById('welcome-video') as HTMLVideoElement;
                    if (video.paused) {
                      video.play();
                      setIsVideoPlaying(true);
                    } else {
                      video.pause();
                      setIsVideoPlaying(false);
                    }
                    // Always unmute on any click
                    video.muted = false;
                  }}
                >
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl sm:shadow-2xl transition-all duration-300"
                    style={{ 
                      backgroundColor: brandPrimary,
                      transform: 'scale(1)',
                    }}
                  >
                    {isVideoPlaying ? (
                      // Pause icon
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      // Play icon
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </div>
                </button>
              </div>
              
              {/* Message Box Below Video */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: `${brandPrimary}30`, backgroundColor: `${brandPrimary}05` }}>
                <h3 className="font-semibold text-base sm:text-lg mb-1" style={{ color: brandPrimary }}>
                  A Message From the {business?.business_name || "Team"}!
                </h3>
                <p className="text-sm text-gray-600">
                  Watch this short video to hear a special message and learn more about leaving a great review.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mt-6 sm:mt-8">
              {/* Personal Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Your Name <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e. Jane Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Your Email <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e. jane.doe@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

                        {/* Custom Questions */}
              {campaign?.custom_questions && campaign.custom_questions.length > 0 && (
                <div className="space-y-5 pt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    <span className="text-sm font-semibold text-muted-foreground">Additional Questions</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  </div>
                  
                  {campaign.custom_questions.map((q, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`custom-${index}`} className="text-sm font-semibold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" 
                             style={{ backgroundColor: q.required ? brandPrimary : '#9CA3AF' }}></div>
                        {q.question} {q.required && "*"}
                      </Label>
                      <Textarea
                        id={`custom-${index}`}
                        placeholder="Share your thoughts..."
                        value={formData.customAnswers[`q${index}`] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customAnswers: {
                              ...formData.customAnswers,
                              [`q${index}`]: e.target.value,
                            },
                          })
                        }
                        required={q.required}
                        rows={4}
                        className="border-2 resize-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Rating */}
              {(!campaign || campaign.allow_rating) && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandPrimary }}></div>
                    How would you rate your experience? *
                  </Label>
                  <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start p-4 bg-muted/30 rounded-xl">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className="transition-all hover:scale-125 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1"
                        style={{ 
                          ['--tw-ring-color' as any]: brandPrimary 
                        }}
                      >
                        <Star
                          className={`h-8 w-8 sm:h-10 sm:w-10 transition-all ${
                            formData.rating >= rating
                              ? "fill-current"
                              : ""
                          }`}
                          style={{ 
                            color: formData.rating >= rating ? brandPrimary : '#D1D5DB' 
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  {formData.rating > 0 && (
                    <p className="text-sm text-center sm:text-left" style={{ color: brandPrimary }}>
                      {formData.rating === 5 ? "⭐ Excellent!" : 
                       formData.rating === 4 ? "😊 Great!" : 
                       formData.rating === 3 ? "👍 Good!" : 
                       formData.rating === 2 ? "😐 Fair" : "😞 Needs Improvement"}
                    </p>
                  )}
                </div>
              )}

              {/* Testimonial Text */}
              {(!campaign || campaign.allow_text) && (
                <div className="space-y-2 group">
                  <Label htmlFor="text" className="text-sm font-semibold flex items-center gap-2 smooth-transition group-focus-within:translate-x-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-glow-pulse"></div>
                    Your Testimonial (optional)
                  </Label>
                  <Textarea
                    id="text"
                    placeholder="Tell us about your experience..."
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={6}
                    className="liquid-glass border-2 resize-none smooth-transition focus:shadow-lg focus:scale-[1.01] rounded-2xl min-h-[150px]"
                    style={{ borderColor: `${brandPrimary}15` }}
                  />
                  <p className="text-xs text-muted-foreground smooth-transition group-focus-within:text-foreground">
                    Share your honest feedback to help others
                  </p>
                </div>
              )}

              {/* Photo and Video Upload Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Photo Upload */}
                {(!campaign || campaign.allow_photo) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Add Photos <span className="text-gray-400">(optional)</span>
                    </Label>
                    <div className="border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                         style={{ borderColor: photoPreviewUrls.length > 0 ? brandPrimary : '#e5e7eb' }}>
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: `${brandPrimary}15` }}>
                          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: brandPrimary }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Drag & drop or click to<br />upload photos
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      {photoPreviewUrls.length > 0 && (
                        <div className="mt-3 text-xs text-gray-600">
                          {photoPreviewUrls.length} photo(s) selected
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Upload */}
                {(!campaign || campaign.allow_video) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Add Video <span className="text-gray-400">(optional)</span>
                    </Label>
                    <div className="border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                         style={{ borderColor: videoPreviewUrls.length > 0 ? brandSecondary : '#e5e7eb' }}>
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: `${brandSecondary}15` }}>
                          <VideoIcon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: brandSecondary }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Drag & drop or click to<br />upload a video.
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </label>
                      {videoPreviewUrls.length > 0 && (
                        <div className="mt-3 text-xs text-gray-600">
                          {videoPreviewUrls.length} video(s) selected
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Previews Grid */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2"
                         style={{ borderColor: `${brandPrimary}30` }}>
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Previews */}
              {videoPreviewUrls.length > 0 && (
                <div className="space-y-2">
                  {videoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border-2"
                         style={{ borderColor: `${brandSecondary}30` }}>
                      <video src={url} className="w-full aspect-video object-cover" controls />
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Old photo/video upload sections removed */}
              {false && (!campaign || campaign.allow_photo) && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 animate-glow-pulse" style={{ color: brandPrimary }} />
                    Add Photos (optional)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 shadow-sm"
                           style={{ borderColor: `${brandPrimary}30` }}>
                        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-current hover:bg-muted/30 group"
                           style={{ borderColor: `${brandPrimary}40` }}>
                      <Upload className="h-8 w-8 mb-2 transition-transform group-hover:scale-110" 
                              style={{ color: brandPrimary }} />
                      <span className="text-xs text-muted-foreground text-center px-2">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Video Upload */}
              {false && (!campaign || campaign.allow_video) && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" style={{ color: brandSecondary }} />
                    Add Video (optional)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-video rounded-xl overflow-hidden border-2 shadow-sm"
                           style={{ borderColor: `${brandSecondary}30` }}>
                        <video src={url} className="w-full h-full object-cover" controls />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {videoPreviewUrls.length === 0 && (
                      <label className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-current hover:bg-muted/30 group"
                             style={{ borderColor: `${brandSecondary}40` }}>
                        <Upload className="h-8 w-8 mb-2 transition-transform group-hover:scale-110" 
                                style={{ color: brandSecondary }} />
                        <span className="text-xs text-muted-foreground text-center px-2">Upload Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 sm:pt-6">
                <Button
                  type="submit"
                  disabled={loading || formData.rating === 0}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity touch-manipulation"
                  style={{ 
                    backgroundColor: brandPrimary,
                    color: 'white'
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      ✨ Submit Feedback
                    </span>
                  )}
                </Button>
              </div>

              {/* Footer Branding */}
              {business.show_branding !== false && (
                <div className="pt-6 text-center border-t border-border/50">
                  <p className="text-xs text-muted-foreground smooth-transition hover:text-foreground">
                    Powered by <span className="font-bold bg-gradient-to-r bg-clip-text text-transparent" 
                                     style={{ backgroundImage: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
                      Trustly
                    </span>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
    </div>
  );
};

export default Submit;