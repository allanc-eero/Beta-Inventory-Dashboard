'use client';

// Shows whether this machine is signed in to the eero Admin API (prod + stage) —
// that sign-in is what turns imported serials into real Insight/Admin links.
// Collapsed to one line when all is well; opens with the exact fix when it isn't.
import { useEffect, useState } from 'react';
import { Card, Tag, Button, CopyableText } from '@amzn/eero-web-design-components';
import { runDeviceSync } from '@/lib/networkSync';
import { useDeviceStore } from '@/store/deviceStore';
import { useEeroStatusStore, EeroState as State } from '@/store/eeroStatusStore';

const LABEL: Record<State, { text: string; color: 'green' | 'orange' | 'red' | 'grey' }> = {
  connected: { text: 'Connected', color: 'green' },
  expired: { text: 'Session expired', color: 'orange' },
  not_signed_in: { text: 'Not signed in', color: 'orange' },
  cli_missing: { text: 'eero CLI not installed', color: 'red' },
  error: { text: 'Unavailable', color: 'grey' },
};
const DEMO_NOTE = 'This sign-in step is only temporary while you demo this prototype on your own computer. The hosted app will be connected to eero once, on the server, so nobody will need to do this.';
const CLOUD: Record<'prod' | 'stage', string> = { prod: 'Beta devices (prod)', stage: 'Dogfood devices (stage)' };

export default function EeroConnectionCard() {
  const { status, checking, refresh: check } = useEeroStatusStore();
  const { devices } = useDeviceStore();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Look every device up now (instead of waiting for the weekly online check).
  const lookUpAll = async () => {
    setSyncing(true);
    setSyncMsg('');
    const r = await runDeviceSync();
    setSyncing(false);
    setSyncMsg(r.success
      ? `Checked ${r.checked} device${r.checked === 1 ? '' : 's'} — ${r.online} online, ${r.notFound} not found in eero yet. Insight/Admin links are updated.`
      : `Couldn't finish: ${r.error || 'unknown error'}`);
  };

  useEffect(() => { check(); }, [check]);

  const allGood = status && status.prod.state === 'connected' && status.stage.state === 'connected';
  const needsFix = eeroNeedsAttention(status, devices.some((d) => d.program === 'dogfood'));
  // Opens by itself when a cloud you actually use isn't connected.
  useEffect(() => { if (needsFix) setOpen(true); }, [needsFix]);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page)] px-4 py-2.5">
        <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">eero</span>
        <span className="rounded bg-[var(--ui-background-layer-layer-page-hover)] px-1.5 py-0.5 text-xs text-[var(--ui-text-text-tertiary)]" title={DEMO_NOTE}>Temporary · prototype demo</span>
        {(['prod', 'stage'] as const).map((env) => {
          const st = status?.[env];
          const l = st ? LABEL[st.state] : null;
          return (
            <span key={env} className="flex items-center gap-1.5 text-xs text-[var(--ui-text-text-secondary)]">
              {env === 'prod' ? 'Beta' : 'Dogfood'}
              <Tag color={l?.color || 'grey'} size="regular">{l ? (st!.state === 'connected' ? '✓ Connected' : l.text) : checking ? 'Checking…' : 'Unknown'}</Tag>
            </span>
          );
        })}
        <div className="ml-auto"><Button type="text" label="Details" onClick={() => setOpen(true)} /></div>
      </div>
    );
  }

  return (
    <Card
      size={5}
      title={
        <span className="flex items-center gap-2">
          <span className="font-semibold text-[var(--ui-text-text-primary)]">eero connection</span>
          <span className="rounded bg-[var(--ui-background-layer-layer-page-hover)] px-1.5 py-0.5 text-xs font-normal text-[var(--ui-text-text-tertiary)]">Temporary · prototype demo</span>
        </span>
      }
      extra={<Button type="text" label="Hide" onClick={() => setOpen(false)} />}
    >
      <p className="mb-2 text-xs text-[var(--ui-text-text-secondary)]">{DEMO_NOTE}</p>
      <p className="mb-3 text-xs text-[var(--ui-text-text-tertiary)]">
        {allGood
          ? 'Imported serials are looked up in eero automatically — each device gets its real Insight network and Admin account links.'
          : 'Sign in to eero so imported serials can be looked up — that\'s what gives each device its real Insight network and Admin account links. Until then the app uses sample data and those links stay hidden.'}
      </p>
      <div className="flex flex-col gap-3">
        {(['prod', 'stage'] as const).map((env) => {
          const s = status?.[env];
          const l = s ? LABEL[s.state] : null;
          return (
            <div key={env} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)] px-3 py-2">
              <span className="w-48 text-sm font-medium text-[var(--ui-text-text-primary)]">{CLOUD[env]}</span>
              {l ? <Tag color={l.color} size="regular">{l.text}</Tag> : <Tag color="grey" size="regular">{checking ? 'Checking…' : 'Unknown'}</Tag>}
              {s?.state === 'connected' && s.user && <span className="text-xs text-[var(--ui-text-text-tertiary)]">as {s.user}</span>}
              {s && s.state !== 'connected' && s.fix && (
                <span className="flex items-center gap-2 text-xs text-[var(--ui-text-text-secondary)]">
                  Run in a terminal (on VPN):
                  <CopyableText text={s.fix.replace(/\s+\(on VPN\)$/, '')} title="Copy command" titleSuccess="Copied" className="font-mono" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="default" label={checking ? 'Checking…' : 'Recheck'} onClick={check} disabled={checking} />
        {status && (status.prod.state === 'connected' || status.stage.state === 'connected') && (
          <Button type="primary" label={syncing ? 'Looking up…' : 'Look up all devices now'} onClick={lookUpAll} disabled={syncing} />
        )}
        <span className="text-xs text-[var(--ui-text-text-tertiary)]">After signing in, click Recheck — no restart needed. Setup steps are in the README under “Connect to eero”.</span>
      </div>
      {syncMsg && <p className="mt-2 text-xs text-[var(--ui-text-text-secondary)]">{syncMsg}</p>}
    </Card>
  );
}

// True when a cloud the user actually needs isn't connected: prod always (beta),
// stage only when there are dogfood devices.
export function eeroNeedsAttention(
  status: { prod: { state: State }; stage: { state: State } } | null,
  hasDogfood: boolean,
): boolean {
  if (!status) return false;
  return status.prod.state !== 'connected' || (hasDogfood && status.stage.state !== 'connected');
}
