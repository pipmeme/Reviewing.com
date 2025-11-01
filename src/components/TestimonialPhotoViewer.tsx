import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestimonialPhotoViewerProps {
  photoUrl: string | null;
  testimonialId: string;
  customerName: string;
  onPhotoRemoved: () => void;
}

export const TestimonialPhotoViewer = ({
  photoUrl,
  testimonialId,
  customerName,
  onPhotoRemoved,
}: TestimonialPhotoViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleDownload = async () => {
    if (!photoUrl) return;
    
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${customerName.replace(/\s+/g, "-")}-testimonial.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Photo downloaded!");
    } catch (error) {
      toast.error("Failed to download photo");
    }
  };

  const handleRemovePhoto = async () => {
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ photo_url: null })
        .eq("id", testimonialId);

      if (error) throw error;

      toast.success("Photo removed from testimonial");
      setIsOpen(false);
      onPhotoRemoved();
    } catch (error: any) {
      toast.error("Failed to remove photo");
    } finally {
      setRemoving(false);
    }
  };

  if (!photoUrl) {
    return (
      <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer"
      >
        <img
          src={photoUrl}
          alt={`Photo from ${customerName}`}
          className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-medium">View</span>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo from {customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <img
                src={photoUrl}
                alt={`Photo from ${customerName}`}
                className="w-full rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemovePhoto}
                disabled={removing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {removing ? "Removing..." : "Remove Photo"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Remove the photo if it's not suitable. The testimonial text will remain.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
