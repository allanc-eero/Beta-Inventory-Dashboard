// Color tokens for the Programs feature — one source of truth for bars/values/charts.
export const TEXT_PRIMARY = 'var(--ui-text-text-primary)';
export const TEXT_SECONDARY = 'var(--ui-text-text-secondary)';
export const TEXT_TERTIARY = 'var(--ui-text-text-tertiary)';
export const TRACK = 'var(--ui-core-gray-gray-2)';

// Semantic status colors (used for reliability/rate bars).
export const OK_GREEN = 'var(--ui-core-green-green-6)';
export const WARN_ORANGE = 'var(--ui-core-orange-orange-5)';
export const BAD_RED = 'var(--ui-core-red-red-6)';
export const ACCENT = 'var(--ui-core-periwinkle-periwinkle-6)'; // primary brand accent for bars/values

// Chart bar palettes, hoisted so they're allocated once (not per render).
export const RATING_BAR_COLORS = ['var(--ui-core-red-red-6)', 'var(--ui-core-orange-orange-5)', 'var(--ui-core-yellow-yellow-5)', 'var(--ui-core-green-green-4)', 'var(--ui-core-green-green-6)'];
// Cohesive cool palette (periwinkle/ocean/purple family) — no clashing warm hues.
export const CHOICE_BAR_COLORS = ['var(--ui-core-periwinkle-periwinkle-6)', 'var(--ui-core-ocean-blue-ocean-6)', 'var(--ui-core-purple-purple-6)', 'var(--ui-core-periwinkle-periwinkle-4)', 'var(--ui-core-ocean-blue-ocean-4)'];
