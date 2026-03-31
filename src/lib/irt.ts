/**
 * Simple IRT (Item Response Theory) Scoring Simulation
 * In a real scenario, this involves complex probability models (1PL, 2PL, 3PL).
 * Here we use a weighted approach based on question difficulty.
 */

import { Question } from "../data/mockData";

export function calculateIRTScore(results: { questionId: string; isCorrect: boolean; difficulty: number }[]) {
  if (results.length === 0) return 0;

  // Weighted score: Correct answers on difficult questions give more points
  // Base score is 1000
  let totalWeight = 0;
  let earnedWeight = 0;

  results.forEach(res => {
    // Difficulty acts as a multiplier
    const weight = res.difficulty * 100;
    totalWeight += weight;
    if (res.isCorrect) {
      earnedWeight += weight;
    }
  });

  // Normalize to a scale of 0-1000
  const rawScore = (earnedWeight / totalWeight) * 1000;
  
  // Add some "IRT magic" - penalize guessing or inconsistent patterns (simplified)
  return Math.round(rawScore);
}

export function getTargetComparison(score: number) {
  const target = 720; // Estimated safe score for Gizi IPB
  const diff = score - target;
  return {
    target,
    diff,
    status: diff >= 0 ? 'AMAN' : 'BELUM AMAN',
    color: diff >= 0 ? 'text-green-500' : 'text-red-500'
  };
}
