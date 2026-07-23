/**
 * Velocity utilities — compute idea momentum metrics from project timestamps.
 * All calculations are client-side from existing project fields (no server changes needed).
 */

import type { Project } from "@shared/schema";

export interface VelocityMetrics {
  /** Days since the project was created */
  ageDays: number;
  /** Days since last update */
  daysSinceUpdate: number;
  /** True if the idea has been in "exploring" for 30+ days with no updates */
  isStale: boolean;
  /** Velocity score 0-10: how quickly the idea is progressing */
  velocityScore: number;
  /** Velocity label for display */
  velocityLabel: "Stalled" | "Slow" | "Steady" | "Fast" | "Hot";
  /** Velocity color for badges */
  velocityColor: string;
}

export function computeVelocity(project: Project): VelocityMetrics {
  const now = Date.now();
  const created = new Date(project.createdAt).getTime();
  const updated = new Date(project.updatedAt).getTime();

  const ageDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  const daysSinceUpdate = Math.max(0, Math.floor((now - updated) / (1000 * 60 * 60 * 24)));

  const ideaStatus = project.ideaStatus || "exploring";
  const isStale = ideaStatus === "exploring" && ageDays >= 30 && daysSinceUpdate >= 14;

  // Velocity score: based on progress, recency of updates, and status
  let score = 0;

  // Progress contributes up to 4 points
  score += Math.min(4, (project.progress || 0) / 25);

  // Recency contributes up to 3 points (updated within last 7 days = 3, within 14 = 2, within 30 = 1)
  if (daysSinceUpdate <= 7) score += 3;
  else if (daysSinceUpdate <= 14) score += 2;
  else if (daysSinceUpdate <= 30) score += 1;

  // Status contributes up to 3 points
  if (ideaStatus === "active") score += 3;
  else if (ideaStatus === "exploring") score += 1;
  else if (ideaStatus === "backburner") score += 0;
  // archived = 0

  // Penalize stale ideas
  if (isStale) score = Math.min(score, 1);

  const velocityScore = Math.round(Math.min(10, score));

  let velocityLabel: VelocityMetrics["velocityLabel"];
  let velocityColor: string;

  if (velocityScore >= 8) {
    velocityLabel = "Hot";
    velocityColor = "border-orange-500 text-orange-600 bg-orange-500/10";
  } else if (velocityScore >= 6) {
    velocityLabel = "Fast";
    velocityColor = "border-green-500 text-green-600 bg-green-500/10";
  } else if (velocityScore >= 4) {
    velocityLabel = "Steady";
    velocityColor = "border-blue-500 text-blue-600 bg-blue-500/10";
  } else if (velocityScore >= 2) {
    velocityLabel = "Slow";
    velocityColor = "border-yellow-500 text-yellow-600 bg-yellow-500/10";
  } else {
    velocityLabel = "Stalled";
    velocityColor = "border-red-500 text-red-600 bg-red-500/10";
  }

  return { ageDays, daysSinceUpdate, isStale, velocityScore, velocityLabel, velocityColor };
}

export interface StreakMetrics {
  /** Current streak: consecutive days with at least one project update */
  currentStreak: number;
  /** Longest streak achieved */
  longestStreak: number;
  /** Total active days (days with updates across all projects) */
  activeDays: number;
  /** Last 30 days activity map (1 = active, 0 = inactive) */
  activityMap: number[];
}

export function computeStreak(projects: Project[]): StreakMetrics {
  if (projects.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0, activityMap: new Array(30).fill(0) };
  }

  // Collect all update dates
  const updateDates = new Set<string>();
  for (const p of projects) {
    const d = new Date(p.updatedAt);
    updateDates.add(d.toDateString());
  }

  // Build last-30-days activity map
  const activityMap: number[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    activityMap.push(updateDates.has(day.toDateString()) ? 1 : 0);
  }

  // Compute current streak (counting back from today)
  let currentStreak = 0;
  for (let i = activityMap.length - 1; i >= 0; i--) {
    if (activityMap[i] === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Compute longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const active of activityMap) {
    if (active === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const activeDays = activityMap.filter(a => a === 1).length;

  return { currentStreak, longestStreak, activeDays, activityMap };
}
