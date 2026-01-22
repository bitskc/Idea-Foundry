import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewIdea from "@/pages/new-idea";
import Conversation from "@/pages/conversation";
import PrdView from "@/pages/prd-view";
import IdeaDetail from "@/pages/idea-detail";
import AuthPage from "@/pages/auth";

function Router() {
  return (
    <Switch>
      {/* Marketing / Landing page */}
      <Route path="/" component={Landing} />

      {/* Auth */}
      <Route path="/auth" component={AuthPage} />

      {/* App routes */}
      <Route path="/app" component={Dashboard} />
      <Route path="/app/new" component={NewIdea} />
      <Route path="/app/ideas/:id" component={IdeaDetail} />
      <Route path="/app/conversation/:id" component={Conversation} />
      <Route path="/app/prd/:id" component={PrdView} />

      {/* Legacy routes - redirect support */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/idea/:id" component={IdeaDetail} />
      <Route path="/conversation/:id" component={Conversation} />
      <Route path="/prd/:id" component={PrdView} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
