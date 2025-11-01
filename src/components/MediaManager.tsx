import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Download, Trash2, Check, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  status: string;
  uploaded_at: string;
}

interface MediaManagerProps {
  testimonialId: string;
  customerName: string;
  onMediaUpdated: () => void;
}

export const MediaManager = ({ testimonialId, customerName, onMediaUpdated }: MediaManagerProps) => {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const { data: photosData } = await supabase
        .from('testimonial_photos')
        .select('*')
        .eq('testimonial_id', testimonialId)
        .order('uploaded_at', { ascending: false });

      const { data: videosData } = await supabase
        .from('testimonial_videos')
        .select('*')
        .eq('testimonial_id', testimonialId)
        .order('uploaded_at', { ascending: false });

      setPhotos(photosData?.map(p => ({ ...p, url: p.photo_url, type: 'photo' as const })) || []);
      setVideos(videosData?.map(v => ({ ...v, url: v.video_url, type: 'video' as const })) || []);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadMedia();
  };

  const handleDownload = async (media: MediaItem) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customerName}-${media.type}-${media.id}.${media.type === 'photo' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded successfully');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download');
    }
  };

  const handleStatusUpdate = async (media: MediaItem, newStatus: 'approved' | 'rejected') => {
    try {
      const table = media.type === 'photo' ? 'testimonial_photos' : 'testimonial_videos';
      const { error } = await supabase
        .from(table)
        .update({ 
          status: newStatus,
          approved_at: newStatus === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', media.id);

      if (error) throw error;

      toast.success(`${media.type === 'photo' ? 'Photo' : 'Video'} ${newStatus}`);
      loadMedia();
      onMediaUpdated();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (media: MediaItem) => {
    if (!confirm(`Are you sure you want to delete this ${media.type}?`)) return;

    try {
      const table = media.type === 'photo' ? 'testimonial_photos' : 'testimonial_videos';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', media.id);

      if (error) throw error;

      toast.success(`${media.type === 'photo' ? 'Photo' : 'Video'} deleted`);
      loadMedia();
      onMediaUpdated();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const totalMedia = photos.length + videos.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={totalMedia === 0}
      >
        {totalMedia > 0 ? `View Media (${totalMedia})` : 'No Media'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media from {customerName}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">Loading media...</div>
          ) : (
            <div className="space-y-6">
              {photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Photos ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt="Testimonial"
                          className="w-full h-48 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedMedia(photo)}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="icon"
                            variant={photo.status === 'approved' ? 'default' : 'outline'}
                            className="h-8 w-8"
                            onClick={() => handleStatusUpdate(photo, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={photo.status === 'rejected' ? 'destructive' : 'outline'}
                            className="h-8 w-8"
                            onClick={() => handleStatusUpdate(photo, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => handleDownload(photo)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDelete(photo)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <VideoIcon className="w-5 h-5" />
                    Videos ({videos.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div key={video.id} className="relative group">
                        <video
                          src={video.url}
                          controls
                          className="w-full rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="icon"
                            variant={video.status === 'approved' ? 'default' : 'outline'}
                            className="h-8 w-8"
                            onClick={() => handleStatusUpdate(video, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={video.status === 'rejected' ? 'destructive' : 'outline'}
                            className="h-8 w-8"
                            onClick={() => handleStatusUpdate(video, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => handleDownload(video)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDelete(video)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalMedia === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No media uploaded yet
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedMedia && selectedMedia.type === 'photo' && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-3xl">
            <img src={selectedMedia.url} alt="Full size" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
