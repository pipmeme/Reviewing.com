import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, CheckCircle, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-testimonials.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Trustly</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Collect testimonials.
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Build trust.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                The easiest way to collect, manage, and display customer testimonials. 
                Boost conversions with social proof in minutes.
              </p>
              <div className="flex gap-4">
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required · 14-day free trial
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="Testimonials showcase"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-muted-foreground">
              Powerful features to collect and showcase testimonials
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Quick Collection</h3>
              <p className="text-muted-foreground">
                Share a simple link with customers. They submit testimonials in seconds.
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <h3 className="text-2xl font-bold mb-3">Easy Management</h3>
              <p className="text-muted-foreground">
                Approve, reject, or edit testimonials from your dashboard.
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-3">Embeddable Widget</h3>
              <p className="text-muted-foreground">
                Display approved testimonials on your website with one line of code.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-none">
            <h2 className="text-4xl font-bold mb-4">Ready to build trust?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of businesses collecting testimonials with Trustly
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-12">
                Get Started Free
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Trustly. Built with Lovable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;