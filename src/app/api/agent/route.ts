import { NextRequest, NextResponse } from 'next/server';

// ─── Local Smart Engine ───────────────────────────────────────────────────────
// Pattern-matching agent that answers queries against dashboard data.
// No external API needed. Upgrade to Bedrock Claude when access is granted.

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const data = context ? JSON.parse(context) : null;
    const answer = processQuery(query.toLowerCase(), data);

    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ answer: `⚠️ Error: ${error.message}` });
  }
}

function processQuery(query: string, data: any): string {
  if (!data) return 'No data available. Make sure devices are loaded in the dashboard.';

  const { stats, devices, testers } = data;

  // ─── Device count queries ───────────────────────────────────────────
  if (query.match(/how many.*(device|unit)/)) {
    if (query.includes('online')) return `**${stats.online}** devices are currently online out of ${stats.total} total.`;
    if (query.includes('offline') || query.includes('not online')) return `**${stats.offline}** devices are currently offline (not online).`;
    if (query.includes('deactivat')) return `**${stats.deactivated}** devices are deactivated.`;
    if (query.includes('pending') || query.includes('return')) return `**${stats.pendingReturn}** devices are pending return.`;
    if (query.includes('total')) return `**${stats.total}** total devices in the system. ${stats.online} online, ${stats.offline} offline, ${stats.deactivated} deactivated.`;
    return `**${stats.total}** total devices. ${stats.online} online, ${stats.offline} offline, ${stats.deactivated} deactivated, ${stats.pendingReturn} pending return.`;
  }

  // ─── Serial lookup ──────────────────────────────────────────────────
  if (query.match(/who has.*serial|serial.*who|look.?up.*[A-Z0-9]{10}/i) || query.match(/[A-Z]{3}[A-Z0-9]{10,}/i)) {
    const serialMatch = query.match(/[A-Z]{2,}[A-Z0-9]{10,}/i) || query.match(/ggc[a-z0-9]+/i);
    if (serialMatch) {
      const serial = serialMatch[0].toUpperCase();
      const device = devices?.find((d: any) => d.serial?.toUpperCase().includes(serial));
      if (device) {
        return `**${device.serial}**\n- Assigned to: ${device.name || 'Unassigned'}\n- Email: ${device.email || '—'}\n- Status: ${device.status}\n- Program: ${device.program}\n- Product: ${device.product || '—'}\n- Country: ${device.country || '—'}\n- Firmware: ${device.firmware || '—'}`;
      }
      return `No device found matching serial "${serial}".`;
    }
  }

  // ─── Person/tester lookup ───────────────────────────────────────────
  if (query.match(/who is|show me.*device|look.?up|find.*person|find.*tester/)) {
    const nameOrEmail = extractNameOrEmail(query);
    if (nameOrEmail) {
      const matchedDevices = devices?.filter((d: any) =>
        d.name?.toLowerCase().includes(nameOrEmail) || d.email?.toLowerCase().includes(nameOrEmail)
      );
      const tester = testers?.find((t: any) =>
        t.name?.toLowerCase().includes(nameOrEmail) || t.email?.toLowerCase().includes(nameOrEmail)
      );

      if (matchedDevices?.length > 0 || tester) {
        let result = '';
        if (tester) {
          result += `**${tester.name}** (${tester.email})\n- ID: ${tester.testerId || '—'}\n- Country: ${tester.country || '—'}\n- Programs: ${tester.programs?.join(', ') || '—'}\n\n`;
        }
        if (matchedDevices?.length > 0) {
          result += `**Devices (${matchedDevices.length}):**\n`;
          matchedDevices.slice(0, 10).forEach((d: any) => {
            result += `- ${d.serial} — ${d.status} (${d.program})\n`;
          });
          if (matchedDevices.length > 10) result += `- ...and ${matchedDevices.length - 10} more\n`;
        }
        return result || 'Found a match but no details available.';
      }
      return `No person or device found matching "${nameOrEmail}".`;
    }
  }

  // ─── Email lookup ───────────────────────────────────────────────────
  if (query.includes('@') || query.match(/whose email|email.*belong/)) {
    const emailMatch = query.match(/[\w.-]+@[\w.-]+/);
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const tester = testers?.find((t: any) => t.email?.toLowerCase() === email);
      const matchedDevices = devices?.filter((d: any) => d.email?.toLowerCase() === email);
      if (tester) {
        return `**${tester.name}** — ${tester.email}\n- Tester ID: ${tester.testerId || '—'}\n- Country: ${tester.country || '—'}\n- Programs: ${tester.programs?.join(', ') || '—'}\n- Devices: ${matchedDevices?.length || 0}`;
      }
      if (matchedDevices?.length > 0) {
        return `Email **${email}** is assigned to ${matchedDevices[0].name || 'unknown'} with ${matchedDevices.length} device(s).`;
      }
      return `No person found with email "${email}".`;
    }
  }

  // ─── Country/region queries ─────────────────────────────────────────
  if (query.match(/device.*(in|from).*(australia|us|uk|eu|canada|japan|singapore|new zealand)/i) || query.match(/(australia|us|uk|eu|canada|japan|singapore).*device/i)) {
    const countryMap: Record<string, string[]> = {
      australia: ['australia', 'aus'], us: ['united states', 'us', 'usa'], uk: ['united kingdom', 'uk'],
      eu: ['germany', 'france', 'italy', 'spain', 'netherlands', 'ireland', 'eu'],
      canada: ['canada', 'ca'], japan: ['japan', 'jpn'], singapore: ['singapore', 'sg'], 'new zealand': ['new zealand', 'nz'],
    };
    for (const [key, variants] of Object.entries(countryMap)) {
      if (variants.some((v) => query.includes(v))) {
        const matched = devices?.filter((d: any) => variants.some((v) => d.country?.toLowerCase().includes(v)));
        if (matched?.length > 0) {
          const online = matched.filter((d: any) => d.status === 'online').length;
          return `**${matched.length}** device(s) in ${key.charAt(0).toUpperCase() + key.slice(1)}. ${online} online, ${matched.length - online} offline/other.`;
        }
        return `No devices found in ${key}.`;
      }
    }
  }

  // ─── Program queries ────────────────────────────────────────────────
  if (query.match(/program|active program|which program|how many program|live program/)) {
    // Build program info the same way ProgramsTab does — group by program with product name
    const programMap: Record<string, { count: number; online: number; product: string }> = {};
    devices?.forEach((d: any) => {
      const prog = d.program || 'other';
      if (!programMap[prog]) programMap[prog] = { count: 0, online: 0, product: '' };
      programMap[prog].count++;
      if (d.status === 'online') programMap[prog].online++;
      if (d.product && !programMap[prog].product) programMap[prog].product = d.product;
    });

    const activePrograms = Object.entries(programMap).filter(([, info]) => info.count > 0);
    if (activePrograms.length > 0) {
      const lines = activePrograms.map(([prog, info]) => {
        const label = info.product ? `${info.product} ${prog.toUpperCase()}` : prog.toUpperCase();
        return `• ${label}: ${info.count} device(s), ${info.online} online`;
      });
      return `Active programs (${activePrograms.length}):\n${lines.join('\n')}`;
    }
    return 'No active programs found.';
  }

  // ─── Return process ─────────────────────────────────────────────────
  if (query.match(/return|how.*return|return process/)) {
    return `**Device Return Process:**\n1. Go to Devices tab → select the device(s)\n2. Click "Return selected →"\n3. Choose reason: Returned to eero, Defective, End of program, or Lost\n4. Complete offboarding steps (Admin removal, Qualtrics, devices)\n5. Confirm — return emails are sent to testers automatically\n6. Track pending returns in Ingestion & Returns → Pending Returns\n\nFor defective/end of program returns, a JIRA ticket is auto-created.`;
  }

  // ─── Stats/summary ──────────────────────────────────────────────────
  if (query.match(/status|summary|overview|dashboard/)) {
    return `**Dashboard Summary:**\n- **${stats.total}** total devices\n- **${stats.online}** online\n- **${stats.offline}** not online\n- **${stats.deactivated}** deactivated\n- **${stats.pendingReturn}** pending return\n- **${stats.testerCount}** testers tracked\n- **${stats.countries?.length || 0}** countries\n- **${stats.programs?.length || 0}** active programs: ${stats.programs?.join(', ') || '—'}`;
  }

  // ─── Tester count ───────────────────────────────────────────────────
  if (query.match(/how many.*(tester|people|person)/)) {
    return `**${stats.testerCount}** testers tracked in the system across ${stats.programs?.length || 0} program(s).`;
  }

  // ─── Recent activity ────────────────────────────────────────────────
  if (query.match(/recent|activity|what happened|latest|history/)) {
    const activity = data.recentActivity;
    if (activity?.length > 0) {
      const lines = activity.slice(0, 10).map((a: any) => `• ${a.serial || '—'}: ${a.description} (${new Date(a.date).toLocaleDateString()})`);
      return `**Recent Activity (last ${Math.min(activity.length, 10)} events):**\n${lines.join('\n')}`;
    }
    return 'No recent activity recorded.';
  }

  // ─── Opt-out queries ────────────────────────────────────────────────
  if (query.match(/opt.?out|opted out|who.*opt/)) {
    const optOuts = data.optOuts;
    if (optOuts?.length > 0) {
      const lines = optOuts.map((o: any) => `• ${o.name} (${o.email}) — ${o.reason}, ${new Date(o.date).toLocaleDateString()}`);
      return `**Opted-out testers (${optOuts.length}):**\n${lines.join('\n')}`;
    }
    return 'No testers have opted out.';
  }

  // ─── Fallback ───────────────────────────────────────────────────────
  return `I can help with:\n- **Device lookups**: "Who has serial GGC...?" or "How many devices are online?"\n- **Tester lookups**: "Show me Jake's devices" or "Who is this email?"\n- **Stats**: "Give me a dashboard summary"\n- **Programs**: "What programs are active?"\n- **Regions**: "How many devices in Australia?"\n- **Activity**: "What happened recently?" or "Show recent activity"\n- **Processes**: "What's the return process?"\n\nTry rephrasing your question.`;
}

function extractNameOrEmail(query: string): string | null {
  // Remove common words to find the name/email
  const cleaned = query
    .replace(/who is|show me|look.?up|find|devices for|devices of|can you|tell me about|'s devices|their devices/gi, '')
    .replace(/[?.,!]/g, '')
    .trim();
  if (cleaned.length > 2) return cleaned.toLowerCase();
  return null;
}
