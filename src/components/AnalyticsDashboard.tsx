import { Card } from "@/components/ui/card";
import { Star, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface AnalyticsDashboardProps {
  totalTestimonials: number;
  pendingCount: number;
  approvedCount: number;
  responseRate?: number;
}

export const AnalyticsDashboard = ({
  totalTestimonials,
  pendingCount,
  approvedCount,
  responseRate,
}: AnalyticsDashboardProps) => {
  const stats = [
    {
      title: "Total Testimonials",
      value: totalTestimonials,
      icon: Star,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending Review",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Approved",
      value: approvedCount,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Response Rate",
      value: responseRate ? `${responseRate}%` : "N/A",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
