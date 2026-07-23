import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Lightbulb, TrendingUp, Target, Users, Clock, DollarSign, Eye, MessageSquare, Pencil, ArrowRight, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";

interface SharedProject {
  id: number;
  title: string;
  description: string;
  type: string;
  ideaStatus: string;
  viabilityScore: number | null;
  viabilityBreakdown: { marketSize: number; competition: number; effort: number; profitPotential: number } | null;
  competitors: Array<{ name: string; description: string; strengths: string[]; weaknesses: string[]; url?: string }> | null;
  keyInsights: string[] | null;
  ideaClassification: { primaryType: string; subtype: string; confidence: number; reasoning: string } | null;
  developmentDifficulty: { overall: number; totalEstimate: string; reasoning: string } | null;
  difficultyRoiRatio: { ratio: number; verdict: string; reasoning: string } | null;
  pivotSuggestions: Array<{ title: string; rationale: string; newAngle: string }> | null;
  specialistAssessments: Array<{ agent: string; role: string; verdict: string; score: number; reasoning: string; recommendations: string[] }> | null;
  prdContent: string | null;
  pitchContent: string | null;
  logoData: string | null;
  techStack: any;
  targetAvatar: any;
  progress: number;
  createdAt: string;
  permissions: string;
}

export default function SharedIdea() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedProject();
    }
  }, [token]);

  const loadSharedProject = async () => {
    try {
      const data = await api.get<SharedProject>(`/api/shared/${token}`);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shared idea");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading shared idea...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">Idea not available</h1>
          <p className="text-muted-foreground">{error || "This share link may have been revoked."}</p>
          <a href="/" className="inline-block mt-4">
            <Button variant="outline">Go to Idea Foundry</Button>
          </a>
        </div>
      </div>
    );
  }

  const viability = project.viabilityBreakdown;
  const competitors = project.competitors || [];
  const insights = project.keyInsights || [];
  const classification = project.ideaClassification;
  const difficulty = project.developmentDifficulty;
  const roi = project.difficultyRoiRatio;
  const pivots = project.pivotSuggestions || [];
  const specialists = project.specialistAssessments || [];

  const permIcon = project.permissions === "edit" ? Pencil : project.permissions === "comment" ? MessageSquare : Eye;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Idea Foundry</span>
            </div>
            <Badge variant="outline" className="gap-1.5">
              {(() => { const Icon = permIcon; return <Icon className="w-3 h-3" /> })()}
              {project.permissions === "view" ? "View only" : project.permissions === "comment" ? "Can comment" : "Can edit"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title section */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{project.type}</Badge>
            <Badge variant="outline" className="capitalize">{project.ideaStatus}</Badge>
            {project.logoData && (
              <img src={project.logoData} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground text-lg">{project.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            <span>{project.progress}% progress</span>
          </div>
        </div>

        {/* Viability Score */}
        {project.viabilityScore && viability && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Viability Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Market Size", value: viability.marketSize, icon: Users, color: "text-blue-500" },
                  { label: "Competition", value: viability.competition, icon: Target, color: "text-orange-500" },
                  { label: "Build Effort", value: viability.effort, icon: Clock, color: "text-purple-500" },
                  { label: "Profit Potential", value: viability.profitPotential, icon: DollarSign, color: "text-green-500" },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="text-center p-4 rounded-lg bg-secondary/50">
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${m.color}`} />
                      <div className="text-2xl font-bold">{m.value}/10</div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Overall:</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${project.viabilityScore >= 7 ? "bg-green-500" : project.viabilityScore >= 4 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${project.viabilityScore * 10}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{project.viabilityScore}/10</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classification */}
        {classification && (
          <Card>
            <CardHeader>
              <CardTitle>Idea Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{classification.primaryType}</Badge>
                <Badge variant="outline">{classification.subtype}</Badge>
                <Badge variant="outline">{Math.round(classification.confidence * 100)}% confidence</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
            </CardContent>
          </Card>
        )}

        {/* Competitors */}
        {competitors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Competitors ({competitors.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitors.map((comp, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{comp.name}</h4>
                    {comp.url && (
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        <ArrowRight className="w-3 h-3 inline" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comp.description}</p>
                  {comp.strengths.length > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600 font-medium">Strengths: </span>
                      {comp.strengths.join(", ")}
                    </div>
                  )}
                  {comp.weaknesses.length > 0 && (
                    <div className="text-xs">
                      <span className="text-red-600 font-medium">Weaknesses: </span>
                      {comp.weaknesses.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {insights.map((insight, i) => <li key={i}>{insight}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Specialist Assessments */}
        {specialists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Specialist Assessments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {specialists.map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">{s.role}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.agent}</span>
                    </div>
                    <Badge variant="outline" className={s.score >= 7 ? "border-green-500 text-green-600" : s.score >= 4 ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"}>
                      {s.score}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.reasoning}</p>
                  {s.recommendations.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {s.recommendations.map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Difficulty & ROI */}
        {difficulty && (
          <Card>
            <CardHeader>
              <CardTitle>Development Difficulty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Overall:</span>
                <Badge variant="outline">{difficulty.overall}/10</Badge>
                <span className="text-sm text-muted-foreground">{difficulty.totalEstimate}</span>
              </div>
              <p className="text-sm text-muted-foreground">{difficulty.reasoning}</p>
            </CardContent>
          </Card>
        )}

        {roi && (
          <Card>
            <CardHeader>
              <CardTitle>Difficulty-to-ROI Ratio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={roi.verdict === "strong" ? "border-green-500 text-green-600" : roi.verdict === "balanced" ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"}>
                  {roi.ratio.toFixed(1)} ({roi.verdict})
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{roi.reasoning}</p>
            </CardContent>
          </Card>
        )}

        {/* Pivot Suggestions */}
        {pivots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pivot Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pivots.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <h4 className="font-semibold text-sm">{p.title}</h4>
                  <p className="text-xs text-muted-foreground">{p.rationale}</p>
                  <p className="text-xs"><span className="font-medium">New angle:</span> {p.newAngle}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* PRD */}
        {project.prdContent && (
          <Card>
            <CardHeader>
              <CardTitle>Product Requirements Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{project.prdContent.slice(0, 5000)}</ReactMarkdown>
              </div>
              {project.prdContent.length > 5000 && (
                <p className="text-xs text-muted-foreground mt-2">... ({project.prdContent.length - 5000} more characters)</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pitch Deck */}
        {project.pitchContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-primary" />
                Pitch Deck
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{project.pitchContent.slice(0, 5000)}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <a href="/">
            <Button variant="outline" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Create your own idea with Idea Foundry
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
