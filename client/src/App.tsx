import { Switch, Route, Redirect } from "wouter";
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

function Router() {
  return (
    <Switch>
      {/* Marketing / Landing page */}
      <Route path="/" component={Landing} />
      
      {/* App routes */}
      <Route path="/app" component={Dashboard} />
      <Route path="/app/new" component={NewIdea} />
      <Route path="/app/ideas/:id" component={IdeaDetail} />
      <Route path="/app/conversation/:id" component={Conversation} />
      <Route path="/app/prd/:id" component={PrdView} />
      
      {/* Legacy routes - redirect to canonical /app/* paths */}
      <Route path="/dashboard">
        <Redirect to="/app" />
      </Route>
      <Route path="/idea/:id">
        {(params) => <Redirect to={`/app/ideas/${params.id}`} />}
      </Route>
      <Route path="/conversation/:id">
        {(params) => <Redirect to={`/app/conversation/${params.id}`} />}
      </Route>
      <Route path="/prd/:id">
        {(params) => <Redirect to={`/app/prd/${params.id}`} />}
      </Route>
      
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
