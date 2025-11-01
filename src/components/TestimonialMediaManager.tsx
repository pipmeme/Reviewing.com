import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, CheckCircle, XCircle, Upload, Play, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MediaManagerProps {
  testimonialId: string;
  customerName: string;
  onMediaUpdated?: () => void;
}

interface Photo {
  id: string;
  photo_url: string;
  status: string;
  uploaded_at: string;
}

interface Video {
  id: string;
  video_url: string;
  status: string;
  uploaded_at: string;
}

export const TestimonialMediaManager = ({ testimonialId, customerName, onMediaUpdated }: MediaManagerProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [testimonialId]);

  const loadMedia = async () => {
    setLoading(true);
    
    const [photosResult, videosResult] = await Promise.all([
      supabase
        .from("testimonial_photos")
        .select("*")
        .eq("testimonial_id", testimonialId)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("testimonial_videos")
        .select("*")
        .eq("testimonial_id", testimonialId)
        .order("uploaded_at", { ascending: false })
    ]);

    if (photosResult.data) setPhotos(photosResult.data);
    if (videosResult.data) setVideos(videosResult.data);
    
    setLoading(false);
  };

  const updatePhotoStatus = async (photoId: string, status: string) => {
    const { error } = await supabase
      .from("testimonial_photos")
      .update({ 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null 
      })
      .eq("id", photoId);

    if (error) {
      toast.error("Failed to update photo status");
    } else {
      toast.success(`Photo ${status}`);
      loadMedia();
      onMediaUpdated?.();
    }
  };

  const updateVideoStatus = async (videoId: string, status: string) => {
    const { error } = await supabase
      .from("testimonial_videos")
      .update({ 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null 
      })
      .eq("id", videoId);

    if (error) {
      toast.error("Failed to update video status");
    } else {
      toast.success(`Video ${status}`);
      loadMedia();
      onMediaUpdated?.();
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/testimonial-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("testimonial-photos").remove([filePath]);
      }

      const { error } = await supabase
        .from("testimonial_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      toast.success("Photo deleted");
      loadMedia();
      onMediaUpdated?.();
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const deleteVideo = async (videoId: string, videoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = videoUrl.split('/testimonial-videos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("testimonial-videos").remove([filePath]);
      }

      const { error } = await supabase
        .from("testimonial_videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast.success("Video deleted");
      loadMedia();
      onMediaUpdated?.();
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  const downloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleUploadNew = async (files: FileList | null, type: 'photo' | 'video') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const bucket = type === 'photo' ? 'testimonial-photos' : 'testimonial-videos';

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${testimonialId}/${Math.random()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);

        if (type === 'photo') {
          const { error: insertError } = await supabase
            .from('testimonial_photos')
            .insert({
              testimonial_id: testimonialId,
              photo_url: publicUrl,
            });
          if (insertError) throw insertError;
        } else {
          const { error: insertError } = await supabase
            .from('testimonial_videos')
            .insert({
              testimonial_id: testimonialId,
              video_url: publicUrl,
            });
          if (insertError) throw insertError;
        }
      }

      toast.success(`${type === 'photo' ? 'Photos' : 'Videos'} uploaded successfully`);
      loadMedia();
      onMediaUpdated?.();
    } catch (error: any) {
      toast.error(`Failed to upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading media...</div>;
  }

  const totalMedia = photos.length + videos.length;

  if (totalMedia === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">No media uploaded</div>
        
        <div className="flex gap-2">
          <div>
            <Label htmlFor={`upload-photos-${testimonialId}`} className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Photos
                </span>
              </Button>
            </Label>
            <Input
              id={`upload-photos-${testimonialId}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadNew(e.target.files, 'photo')}
            />
          </div>

          <div>
            <Label htmlFor={`upload-videos-${testimonialId}`} className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Videos
                </span>
              </Button>
            </Label>
            <Input
              id={`upload-videos-${testimonialId}`}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadNew(e.target.files, 'video')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {photos.length} photo(s), {videos.length} video(s)
        </div>
        
        <div className="flex gap-2">
          <div>
            <Label htmlFor={`upload-photos-${testimonialId}`} className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Photos
                </span>
              </Button>
            </Label>
            <Input
              id={`upload-photos-${testimonialId}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadNew(e.target.files, 'photo')}
            />
          </div>

          <div>
            <Label htmlFor={`upload-videos-${testimonialId}`} className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Videos
                </span>
              </Button>
            </Label>
            <Input
              id={`upload-videos-${testimonialId}`}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadNew(e.target.files, 'video')}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo) => (
          <Card key={photo.id} className="p-2 space-y-2">
            <div 
              className="relative aspect-square rounded overflow-hidden cursor-pointer group"
              onClick={() => setPreviewMedia({ url: photo.photo_url, type: 'photo' })}
            >
              <img 
                src={photo.photo_url} 
                alt="Testimonial" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <Badge variant={photo.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
              {photo.status}
            </Badge>

            <div className="flex gap-1">
              {photo.status !== 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePhotoStatus(photo.id, 'approved')}
                  className="h-8 px-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {photo.status !== 'rejected' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePhotoStatus(photo.id, 'rejected')}
                  className="h-8 px-2"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadMedia(photo.photo_url, `${customerName}-photo-${photo.id}.jpg`)}
                className="h-8 px-2"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePhoto(photo.id, photo.photo_url)}
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}

        {videos.map((video) => (
          <Card key={video.id} className="p-2 space-y-2">
            <div 
              className="relative aspect-square rounded overflow-hidden cursor-pointer group bg-muted flex items-center justify-center"
              onClick={() => setPreviewMedia({ url: video.video_url, type: 'video' })}
            >
              <Play className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
            </div>
            
            <Badge variant={video.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
              {video.status}
            </Badge>

            <div className="flex gap-1">
              {video.status !== 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateVideoStatus(video.id, 'approved')}
                  className="h-8 px-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {video.status !== 'rejected' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateVideoStatus(video.id, 'rejected')}
                  className="h-8 px-2"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadMedia(video.video_url, `${customerName}-video-${video.id}.mp4`)}
                className="h-8 px-2"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteVideo(video.id, video.video_url)}
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Preview - {customerName}</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div className="w-full">
              {previewMedia.type === 'photo' ? (
                <img 
                  src={previewMedia.url} 
                  alt="Preview" 
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <video 
                  src={previewMedia.url} 
                  controls 
                  className="w-full h-auto rounded-lg"
                  autoPlay
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};