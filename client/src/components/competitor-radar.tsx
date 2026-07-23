import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar, RefreshCw, Plus, Minus, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Project, CompetitorSnapshot } from "@shared/schema";

interface CompetitorRadarProps {
  projectId: number;
  radarEnabled: boolean;
}

interface RadarDiff {
  added: string[];
  removed: string[];
  changed: string[];
  summary: string;
}

interface RadarCheckResult {
  snapshot: CompetitorSnapshot;
  diff: RadarDiff;
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "Never";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CompetitorRadar({ projectId, radarEnabled }: CompetitorRadarProps) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(radarEnabled);

  // Fetch snapshots for this project
  const { data: snapshots, isLoading } = useQuery<CompetitorSnapshot[]>({
    queryKey: [`/api/projects/${projectId}/radar/snapshots`],
    queryFn: () => api.get(`/api/projects/${projectId}/radar/snapshots`),
  });

  const latest = snapshots?.[0];
  const diff = latest?.diffSummary as RadarDiff | null | undefined;

  // Toggle radar on/off
  const toggleMutation = useMutation({
    mutationFn: () => api.post<Project>(`/api/projects/${projectId}/radar/toggle`),
    onSuccess: (project) => {
      setEnabled(project.radarEnabled ?? false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast.success(project.radarEnabled ? "Competitor radar enabled" : "Competitor radar disabled");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to toggle radar"),
  });

  // Manual check
  const checkMutation = useMutation({
    mutationFn: () => api.post<RadarCheckResult>(`/api/projects/${projectId}/radar/check`),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/radar/snapshots`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      const { added, removed, changed } = result.diff;
      const total = added.length + removed.length + changed.length;
      if (total > 0) {
        toast.success(`Radar check complete: ${total} competitor change(s) detected`);
      } else {
        toast.success("Radar check complete: no changes detected");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Radar check failed"),
  });

  const hasChanges =
    !!diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radar className="h-4 w-4" />
            Competitor Radar
          </CardTitle>
          <CardDescription>
            Monitor your competitive landscape and get notified when it shifts.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{enabled ? "On" : "Off"}</span>
          <Switch
            checked={enabled}
            onCheckedChange={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest snapshot summary */}
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Last check: </span>
            <span className="font-medium">
              {isLoading ? "Loading…" : formatDate(latest?.checkedAt ?? null)}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending || !enabled}
          >
            {checkMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Now
          </Button>
        </div>

        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Enable the radar to start tracking competitors. Weekly checks run automatically; you can
            also trigger a check manually anytime.
          </p>
        )}

        {/* Diff summary */}
        {enabled && diff && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{diff.summary}</p>

            {hasChanges && (
              <div className="space-y-2">
                {diff.added.length > 0 && (
                  <ChangeRow icon={<Plus className="h-4 w-4 text-emerald-500" />} label="Added" names={diff.added} />
                )}
                {diff.removed.length > 0 && (
                  <ChangeRow icon={<Minus className="h-4 w-4 text-rose-500" />} label="Removed" names={diff.removed} />
                )}
                {diff.changed.length > 0 && (
                  <ChangeRow
                    icon={<ArrowRightLeft className="h-4 w-4 text-amber-500" />}
                    label="Changed"
                    names={diff.changed}
                  />
                )}
              </div>
            )}

            {/* Latest competitor list */}
            {latest && Array.isArray(latest.competitors) && (latest.competitors as unknown[]).length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Current competitors
                </p>
                <ul className="space-y-1.5">
                  {(latest.competitors as Array<{ name: string; description?: string }>).map((c, i) => (
                    <li key={`${c.name}-${i}`} className="text-sm">
                      <span className="font-medium">{c.name}</span>
                      {c.description && (
                        <span className="text-muted-foreground"> — {c.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {enabled && !diff && !isLoading && (
          <p className="text-sm text-muted-foreground">
            No snapshots yet. Run a check to establish your competitor baseline.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeRow({
  icon,
  label,
  names,
}: {
  icon: React.ReactNode;
  label: string;
  names: string[];
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border px-3 py-2">
      <div className="mt-0.5">{icon}</div>
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
        {names.map((n) => (
          <span key={n} className="text-sm">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
