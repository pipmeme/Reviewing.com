import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Customer {
  name: string;
  email: string;
}

interface RequestBody {
  business_id: string;
  campaign_name: string;
  customers: Customer[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { business_id, campaign_name, customers }: RequestBody = await req.json();

    console.log(`Starting campaign: ${campaign_name} for business: ${business_id}`);

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or unauthorized");
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        business_id,
        name: campaign_name,
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Campaign creation failed: ${campaignError.message}`);
    }

    console.log(`Created campaign: ${campaign.id}`);

    // Create recipients and send emails
    let sentCount = 0;
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("https://", "").replace(".supabase.co", "") || "";
    const appUrl = `https://${baseUrl}.lovable.app`;

    for (const customer of customers) {
      try {
        // Generate unique token
        const uniqueToken = crypto.randomUUID();

        // Insert recipient
        const { error: recipientError } = await supabase
          .from("campaign_recipients")
          .insert({
            campaign_id: campaign.id,
            customer_email: customer.email,
            customer_name: customer.name,
            unique_token: uniqueToken,
            status: "pending",
          });

        if (recipientError) {
          console.error(`Failed to create recipient for ${customer.email}:`, recipientError);
          continue;
        }

        // Create personalized link
        const testimonialLink = `${appUrl}/submit?b=${business_id}&t=${uniqueToken}`;

        // Send email
        const emailResponse = await resend.emails.send({
          from: `${business.business_name} <onboarding@resend.dev>`,
          to: [customer.email],
          subject: `We'd love your feedback! 🌟`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                  .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px 30px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .logo { font-size: 24px; font-weight: bold; color: ${business.brand_color || '#14b8a6'}; }
                  .content { margin-bottom: 30px; }
                  h1 { font-size: 28px; margin: 0 0 20px; color: #1a1a1a; }
                  .button { display: inline-block; background: ${business.brand_color || '#14b8a6'}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                  .button:hover { opacity: 0.9; }
                  .footer { text-align: center; color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">${business.business_name}</div>
                  </div>
                  <div class="content">
                    <h1>Hi ${customer.name}! 👋</h1>
                    <p>Thank you for being a valued customer of ${business.business_name}!</p>
                    <p>We'd really appreciate it if you could take 2 minutes to share your experience with us. Your feedback helps us improve and helps other customers make informed decisions.</p>
                    <p style="text-align: center;">
                      <a href="${testimonialLink}" class="button">Share Your Feedback</a>
                    </p>
                    <p style="font-size: 14px; color: #666;">This should only take about 2 minutes. We really value your input!</p>
                  </div>
                  <div class="footer">
                    <p>This email was sent by ${business.business_name}</p>
                    <p>If you have any questions, please feel free to reach out.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Email sent to ${customer.email}:`, emailResponse);

        // Update recipient status
        await supabase
          .from("campaign_recipients")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("unique_token", uniqueToken);

        sentCount++;
      } catch (error) {
        console.error(`Error sending to ${customer.email}:`, error);
      }
    }

    // Update campaign stats
    await supabase
      .from("campaigns")
      .update({ total_sent: sentCount })
      .eq("id", campaign.id);

    console.log(`Campaign complete. Sent ${sentCount}/${customers.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        sent_count: sentCount,
        total_customers: customers.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-testimonial-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
