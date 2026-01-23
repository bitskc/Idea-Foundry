import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: Zap, text: "Unlimited idea projects" },
  { icon: Users, text: "Priority AI responses" },
  { icon: TrendingUp, text: "Advanced market research" },
  { icon: Sparkles, text: "Export to multiple formats" },
];

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
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
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-primary" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Want to keep using the free tier? You can delete an existing idea to free up a slot.
          </p>
          <Link href="/app">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
