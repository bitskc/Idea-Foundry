import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Users, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { ApiTokensSection } from "@/components/api-tokens";

const features = [
  { icon: Zap, text: "Unlimited idea projects" },
  { icon: Users, text: "Priority AI responses" },
  { icon: TrendingUp, text: "Advanced market research" },
  { icon: Sparkles, text: "Export to multiple formats" },
];

export default function UpgradePage() {
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Fetch current user profile to get subscription status
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/me"],
    queryFn: () => api.get("/api/me"),
  });

  const handleSubscribe = async () => {
    try {
      setIsLoadingPayment(true);
      const res = await api.post<{ url: string }>("/api/create-checkout-session");
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      toast.error("Failed to start checkout");
      console.error(error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPayment(true);
      const res = await api.post<{ url: string }>("/api/create-portal-session");
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      toast.error("Failed to open billing portal");
      console.error(error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPro = user?.subscriptionStatus === "pro";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {isPro ? "Your Subscription" : "Upgrade to Pro"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPro 
              ? "You currently have access to all Pro features." 
              : "Unlock unlimited ideas and advanced AI analysis."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className={`relative ${isPro ? "opacity-50" : ""}`}>
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
          <Card className={`relative border-primary shadow-lg ${isPro ? "bg-primary/5" : ""}`}>
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Active
              </div>
            )}
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
              
              {isPro ? (
                <Button 
                  onClick={handleManageSubscription} 
                  disabled={isLoadingPayment}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {isLoadingPayment && <Loader2 className="h-4 w-4 animate-spin" />}
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isLoadingPayment}
                  className="w-full gap-2"
                >
                  {isLoadingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Upgrade Now
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">
                Secure payment via Stripe. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Tokens Section */}
        <div className="mt-8">
          <ApiTokensSection />
        </div>
      </div>
    </div>
  );
}