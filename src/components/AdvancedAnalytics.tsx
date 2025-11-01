import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Star, CheckCircle, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AdvancedAnalyticsProps {
  businessId: string;
}

interface AnalyticsData {
  totalTestimonials: number;
  approvedTestimonials: number;
  pendingTestimonials: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  testimonialsOverTime: { date: string; count: number }[];
  campaignPerformance: { name: string; count: number }[];
  conversionRate: number;
}

const COLORS = ['#4FD1C5', '#38B2AC', '#319795', '#2C7A7B', '#285E61'];

export const AdvancedAnalytics = ({ businessId }: AdvancedAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTestimonials: 0,
    approvedTestimonials: 0,
    pendingTestimonials: 0,
    averageRating: 0,
    ratingDistribution: [],
    testimonialsOverTime: [],
    campaignPerformance: [],
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [businessId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

      // Get all testimonials
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select('*, campaigns(name)')
        .eq('business_id', businessId)
        .gte('created_at', dateFrom.toISOString());

      if (error) throw error;

      // Calculate statistics
      const total = testimonials?.length || 0;
      const approved = testimonials?.filter(t => t.status === 'approved').length || 0;
      const pending = testimonials?.filter(t => t.status === 'pending').length || 0;
      
      const avgRating = total > 0
        ? testimonials.reduce((acc, t) => acc + (t.rating || 0), 0) / total
        : 0;

      // Rating distribution
      const ratingDist = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: testimonials?.filter(t => t.rating === rating).length || 0,
      }));

      // Testimonials over time (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const overTime = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: testimonials?.filter(t =>
          t.created_at.startsWith(date)
        ).length || 0,
      }));

      // Campaign performance
      const campaignMap = new Map<string, number>();
      testimonials?.forEach(t => {
        const campaignName = (t.campaigns as any)?.name || 'No Campaign';
        campaignMap.set(campaignName, (campaignMap.get(campaignName) || 0) + 1);
      });

      const campaignPerf = Array.from(campaignMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));

      setAnalytics({
        totalTestimonials: total,
        approvedTestimonials: approved,
        pendingTestimonials: pending,
        averageRating: avgRating,
        ratingDistribution: ratingDist,
        testimonialsOverTime: overTime,
        campaignPerformance: campaignPerf,
        conversionRate: total > 0 ? (approved / total) * 100 : 0,
      });
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Testimonials', analytics.totalTestimonials],
      ['Approved', analytics.approvedTestimonials],
      ['Pending', analytics.pendingTestimonials],
      ['Average Rating', analytics.averageRating.toFixed(2)],
      ['Conversion Rate', analytics.conversionRate.toFixed(2) + '%'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully!');
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Testimonials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{analytics.totalTestimonials}</div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{analytics.averageRating.toFixed(1)}</div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{analytics.approvedTestimonials}</div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Testimonials Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Testimonials Over Time</CardTitle>
            <CardDescription>Daily testimonial submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.testimonialsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4FD1C5" strokeWidth={2} name="Testimonials" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of ratings received</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" label={{ value: 'Star Rating', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4FD1C5" name="Number of Testimonials" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      {analytics.campaignPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Testimonials by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.campaignPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.campaignPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
