import { LiveReport } from './types';

// ─── Simulated AI narrative (the "story" layer) ───────────────────────────────
// Interprets the deterministic LiveReport into risks / what's-going-well /
// actions. Deterministic here so the demo works with no model; in the real
// build this is the one piece that calls Bedrock. The DATA is always the
// deterministic report — the narrative only interprets it, hence the disclaimer.

export const AI_DISCLAIMER =
  'This summary is AI-generated from the survey responses and may be incomplete or inaccurate. Always verify against the data below before making decisions.';

export interface AiNarrative {
  summary: string;
  risks: string[];
  goingWell: string[];
  actions: string[];
}

export function generateNarrative(report: LiveReport): AiNarrative {
  const { overallAvg5, flaggedCount, scaleQuestions, choiceQuestions, textQuestions, flaggedResponders } = report;

  // Summary analyzes the data on hand — no "who didn't answer" framing.
  const summary =
    (overallAvg5 !== null
      ? `Overall satisfaction across rated questions is ${overallAvg5}/5. `
      : 'This window has no rated (scale) questions — the summary below is drawn from the choice and open-text answers. ') +
    (flaggedCount > 0
      ? `${flaggedCount} tester${flaggedCount === 1 ? '' : 's'} scored at or below 3/5 and are called out for follow-up below.`
      : 'No testers scored at or below the 3/5 flag line.');

  // Risks — low-scoring rated areas (we don't assume which choice option is
  // "bad"; a human reads the splits).
  const risks: string[] = [];
  scaleQuestions.filter((s) => s.flagged).forEach((s) =>
    risks.push(`“${s.prompt}” averaged ${s.avg5}/5 — below the 3/5 flag line.`));
  scaleQuestions.filter((s) => !s.flagged && s.avg5 < 4).forEach((s) =>
    risks.push(`“${s.prompt}” is ${s.avg5}/5 — soft, worth watching.`));
  if (flaggedResponders.length) {
    const names = flaggedResponders.slice(0, 5).map((f) => f.name).join(', ');
    risks.push(`Lowest-scoring testers: ${names}${flaggedResponders.length > 5 ? ` +${flaggedResponders.length - 5} more` : ''}.`);
  }

  // Going well — rated areas at/above 4, a representative positive verbatim.
  const goingWell: string[] = [];
  scaleQuestions.filter((s) => s.avg5 >= 4).forEach((s) =>
    goingWell.push(`“${s.prompt}” is strong at ${s.avg5}/5.`));
  if (textQuestions.length) {
    const sample = textQuestions[0].verbatims[0];
    if (sample) goingWell.push(`Representative verbatim: “${truncate(sample.text, 140)}” — ${sample.name}.`);
  }

  // Recommended actions.
  const actions: string[] = [];
  if (flaggedResponders.length) actions.push(`Follow up with the ${flaggedResponders.length} flagged tester${flaggedResponders.length === 1 ? '' : 's'} on their low-scored areas.`);
  const bigText = textQuestions[0];
  if (bigText) actions.push(`Review the open feedback on “${bigText.prompt}” for recurring themes.`);
  const notableSplit = choiceQuestions.find((c) => c.breakdown[0] && c.breakdown[0].pct >= 25 && c.breakdown.length > 1);
  if (notableSplit) actions.push(`Dig into “${notableSplit.prompt}” — ${notableSplit.breakdown[0].label} leads at ${notableSplit.breakdown[0].pct}%.`);
  if (!actions.length) actions.push('No blocking actions — keep monitoring the next wave.');

  return { summary, risks, goingWell, actions };
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
