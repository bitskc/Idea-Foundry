import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { shouldShowLandingOnly, shouldShowAppOnly, isLocalDevelopment, getAppUrl, getHomeUrl } from "@/lib/routing";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewIdea from "@/pages/new-idea";
import Conversation from "@/pages/conversation";
import PrdView from "@/pages/prd-view";
import IdeaDetail from "@/pages/idea-detail";
import AuthPage from "@/pages/auth";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import UpgradePage from "@/pages/upgrade";
import SettingsPage from "@/pages/settings";
import SharedIdea from "@/pages/shared-idea";
import { useEffect } from "react";

function SubdomainRouter() {
  const isLandingOnly = shouldShowLandingOnly();
  const isAppOnly = shouldShowAppOnly();
  const isLocal = isLocalDevelopment();
  
  // Redirect if on wrong subdomain
  useEffect(() => {
    const path = window.location.pathname;
    
    // On www subdomain, redirect app routes to plan subdomain
    if (isLandingOnly && (path.startsWith('/app') || path.startsWith('/auth'))) {
      window.location.href = getAppUrl();
      return;
    }
    
    // On plan subdomain, redirect landing to www subdomain
    if (isAppOnly && path === '/') {
      window.location.href = getHomeUrl();
      return;
    }
  }, [isLandingOnly, isAppOnly]);

  // On www subdomain - only show landing page
  if (isLandingOnly) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route>
          {() => {
            // Redirect any other route to plan subdomain
            window.location.href = getAppUrl();
            return <div>Redirecting...</div>;
          }}
        </Route>
      </Switch>
    );
  }

  // On plan subdomain - only show app/auth
  if (isAppOnly) {
    return (
      <Switch>
        {/* Public share route — no auth required */}
        <Route path="/share/:token" component={SharedIdea} />

        <Route path="/" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />

        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/reset-password/:token" component={ResetPasswordPage} />
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
        <Route path="/app/settings">
          {() => <ProtectedRoute><SettingsPage /></ProtectedRoute>}
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

  // Local development or other domains - show all routes
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/share/:token" component={SharedIdea} />
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />

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
      <Route path="/app/settings">
        {() => <ProtectedRoute><SettingsPage /></ProtectedRoute>}
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
        <SubdomainRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
