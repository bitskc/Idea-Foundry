import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Sparkles, Zap, Users, TrendingUp, Mail, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const features = [
  { icon: Zap, text: "Unlimited idea projects" },
  { icon: Users, text: "Priority AI responses" },
  { icon: TrendingUp, text: "Advanced market research" },
  { icon: Sparkles, text: "Export to multiple formats" },
];

export default function UpgradePage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleWaitlistSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // For now, just show success - in production this would save to database
    setIsSubmitted(true);
    toast.success("You're on the list!", {
      description: "We'll notify you when Pro is available.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You've used your 2 free ideas. Upgrade to Pro for unlimited access and advanced features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription>For exploring the platform</CardDescription>
              <div className="text-3xl font-bold mt-2">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4" />
                  2 idea projects
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4" />
                  AI-guided conversations
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Basic PRD generation
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Coming Soon
            </div>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Pro <Sparkles className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>For serious founders</CardDescription>
              <div className="text-3xl font-bold mt-2">
                $19<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-primary" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              
              {isSubmitted ? (
                <div className="text-center py-4 bg-primary/5 rounded-lg">
                  <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">You're on the waitlist!</p>
                  <p className="text-sm text-muted-foreground">We'll email you when Pro launches.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSignup} className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Notify Me
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Get notified when Pro launches. No spam, ever.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4 bg-muted/30 rounded-lg p-6">
          <h3 className="font-semibold">Want to keep using the free tier?</h3>
          <p className="text-muted-foreground">
            You can delete an existing idea to free up a slot, or archive ideas you're not actively working on.
          </p>
          <Link href="/app">
            <Button variant="outline">Manage My Ideas</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
