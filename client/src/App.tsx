import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewIdea from "@/pages/new-idea";
import Conversation from "@/pages/conversation";
import PrdView from "@/pages/prd-view";
import IdeaDetail from "@/pages/idea-detail";
import AuthPage from "@/pages/auth";
import UpgradePage from "@/pages/upgrade";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />

      {/* Protected app routes */}
      <Route path="/app">
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/app/new">
        {() => <ProtectedRoute><NewIdea /></ProtectedRoute>}
      </Route>
      <Route path="/app/ideas/:id">
        {() => <ProtectedRoute><IdeaDetail /></ProtectedRoute>}
      </Route>
      <Route path="/app/conversation/:id">
        {() => <ProtectedRoute><Conversation /></ProtectedRoute>}
      </Route>
      <Route path="/app/prd/:id">
        {() => <ProtectedRoute><PrdView /></ProtectedRoute>}
      </Route>
      <Route path="/app/upgrade">
        {() => <ProtectedRoute><UpgradePage /></ProtectedRoute>}
      </Route>

      {/* Legacy routes - also protected */}
      <Route path="/dashboard">
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/idea/:id">
        {() => <ProtectedRoute><IdeaDetail /></ProtectedRoute>}
      </Route>
      <Route path="/conversation/:id">
        {() => <ProtectedRoute><Conversation /></ProtectedRoute>}
      </Route>
      <Route path="/prd/:id">
        {() => <ProtectedRoute><PrdView /></ProtectedRoute>}
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
        <Sonner />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
