import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Copy, Pencil, ArrowLeft, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function PrdView() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="flex flex-col h-screen md:h-[calc(100vh-theme(spacing.0))] bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display">TaskMaster AI</h1>
                <Badge variant="outline" className="text-xs">v1.0 Draft</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Last edited 2 mins ago</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Document View */}
          <main className="flex-1 overflow-auto p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-card shadow-sm border rounded-xl min-h-[800px] p-8 md:p-12 space-y-8">
              {/* Document Header */}
              <div className="border-b pb-8">
                <h1 className="text-4xl font-display font-bold mb-4">Product Requirements Document</h1>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Product Name</span>
                    <span className="font-medium">TaskMaster AI</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Version</span>
                    <span className="font-medium">1.0 (MVP)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">Ready for Dev</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Date</span>
                    <span className="font-medium">Jan 22, 2026</span>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <section className="space-y-4">
                <div className="flex items-center justify-between group">
                  <h2 className="text-2xl font-display font-bold text-primary">1. Executive Summary</h2>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  TaskMaster AI is an intelligent daily planner that optimizes productivity by aligning tasks with the user's natural energy rhythms. Unlike traditional to-do lists that just list tasks, TaskMaster AI analyzes task complexity and user energy patterns to suggest the perfect schedule.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-primary">2. Problem Statement</h2>
                <div className="bg-muted/50 p-6 rounded-lg border space-y-4">
                   <div>
                     <h3 className="font-semibold mb-2">The Challenge</h3>
                     <p className="text-sm text-muted-foreground">Knowledge workers struggle to maintain focus throughout the day because they schedule high-cognitive tasks during their energy slumps.</p>
                   </div>
                   <div>
                     <h3 className="font-semibold mb-2">Impact</h3>
                     <p className="text-sm text-muted-foreground">Decreased productivity, increased burnout, and lower quality of work.</p>
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-primary">3. User Personas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base">The Overwhelmed Freelancer</CardTitle>
                       <CardDescription>Sarah, 28, Graphic Designer</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                       Needs to juggle multiple client deadlines without burning out. wants a system that tells her what to do next.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base">The ADHD Student</CardTitle>
                       <CardDescription>Alex, 21, Computer Science</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                       Struggles with executive dysfunction. Needs external structure and dopamine hits to keep going.
                    </CardContent>
                  </Card>
                </div>
              </section>
              
               <section className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-primary">4. Core Features</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-2">4.1 Energy Assessment</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>User rates energy level (1-10) upon login</li>
                      <li>Historical data tracks peak performance times</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">4.2 Smart Scheduling</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>AI assigns "Deep Work" to high-energy blocks</li>
                      <li>AI assigns "Admin/Email" to low-energy blocks</li>
                      <li>Drag-and-drop recalibration</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="h-20" /> {/* Spacer */}
          </main>

          {/* Right Panel - Context/TOC */}
          <aside className="w-64 border-l bg-background hidden xl:block p-6">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Table of Contents</h3>
            <nav className="space-y-1">
              {["Executive Summary", "Problem Statement", "User Personas", "Core Features", "Tech Stack", "GTM Strategy"].map((item, i) => (
                <a 
                  key={item} 
                  href="#" 
                  className={`block px-2 py-1.5 text-sm rounded hover:bg-muted ${i === 0 ? "text-primary font-medium bg-primary/5" : "text-muted-foreground"}`}
                >
                  {i + 1}. {item}
                </a>
              ))}
            </nav>
            
            <div className="mt-8">
               <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Export Options</h3>
               <div className="space-y-2">
                 <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                   <FileText className="w-4 h-4" /> PDF
                 </Button>
                 <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                   <Copy className="w-4 h-4" /> Markdown
                 </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                   <Download className="w-4 h-4" /> JSON (for AI Dev)
                 </Button>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
