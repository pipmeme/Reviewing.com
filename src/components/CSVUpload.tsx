import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  name: string;
  email: string;
}

interface CSVUploadProps {
  businessId: string;
  onCampaignSent: () => void;
}

export const CSVUpload = ({ businessId, onCampaignSent }: CSVUploadProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [sending, setSending] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const parsedCustomers: Customer[] = [];
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header

        const [name, email] = line.split(",").map((s) => s.trim());
        if (name && email && email.includes("@")) {
          parsedCustomers.push({ name, email });
        }
      });

      if (parsedCustomers.length === 0) {
        toast.error("No valid customers found in CSV");
        return;
      }

      setCustomers(parsedCustomers);
      toast.success(`Loaded ${parsedCustomers.length} customers`);
    };

    reader.readAsText(file);
  };

  const handleSendCampaign = async () => {
    if (!campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (customers.length === 0) {
      toast.error("Please upload a CSV file first");
      return;
    }

    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to send campaigns");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "send-testimonial-emails",
        {
          body: {
            business_id: businessId,
            campaign_name: campaignName,
            customers: customers,
          },
        }
      );

      if (error) throw error;

      toast.success(`Campaign sent to ${data.sent_count} customers!`);
      setCustomers([]);
      setCampaignName("");
      onCampaignSent();
    } catch (error: any) {
      console.error("Campaign error:", error);
      toast.error(error.message || "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Send Email Campaign</h2>
      <p className="text-muted-foreground mb-6">
        Upload a CSV file with customer emails to send personalized testimonial
        requests. CSV should have: name, email
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Name</label>
          <Input
            placeholder="e.g., January 2025 Customers"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload CSV</label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
            {customers.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {customers.length} customers loaded
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCustomers([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            CSV format: name,email (one customer per line)
          </p>
        </div>

        <Button
          onClick={handleSendCampaign}
          disabled={sending || customers.length === 0 || !campaignName}
          className="w-full"
        >
          {sending ? "Sending..." : `Send to ${customers.length} Customers`}
        </Button>
      </div>
    </Card>
  );
};
