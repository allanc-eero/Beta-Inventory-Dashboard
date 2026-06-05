import { NextRequest, NextResponse } from 'next/server';

const QUALTRICS_BASE_URL = process.env.QUALTRICS_BASE_URL!;
const QUALTRICS_API_TOKEN = process.env.QUALTRICS_API_TOKEN!;
const QUALTRICS_DIRECTORY_ID = process.env.QUALTRICS_DIRECTORY_ID!;

const headers = {
  'X-API-TOKEN': QUALTRICS_API_TOKEN,
  'Content-Type': 'application/json',
};

// ─── POST: Mark contact as opted out or update embedded data ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'optOut') {
      return await optOutContact(body);
    } else if (action === 'optBackIn') {
      return await optBackInContact(body);
    } else if (action === 'findContact') {
      return await findContact(body);
    } else if (action === 'listDirectories') {
      return await listDirectories();
    } else {
      return NextResponse.json({ error: 'Unknown action. Use: optOut, optBackIn, findContact, listDirectories' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Qualtrics API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ─── GET: Search for a contact by email ───────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Provide ?email= parameter' }, { status: 400 });
    }

    // Search contacts in directory using the transactional batch endpoint
    const res = await fetch(
      `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { filterType: 'email', comparison: 'eq', value: email } }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.result || data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Opt-Out Contact ──────────────────────────────────────────────────────────
// Updates the contact's embedded data to mark them as opted out
async function optOutContact(body: any) {
  const { email, contactId, reason, optOutDate, recordedBy } = body;

  // If we have a contactId, update directly. Otherwise search first.
  let targetContactId = contactId;

  if (!targetContactId && email) {
    // Search for the contact using search endpoint
    const searchRes = await fetch(
      `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { filterType: 'email', comparison: 'eq', value: email } }),
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const elements = searchData.result?.elements || [];
      if (elements.length > 0) {
        targetContactId = elements[0].id;
      }
    }
  }

  if (!targetContactId) {
    return NextResponse.json({
      success: false,
      error: `Contact not found in Qualtrics directory for email: ${email}`,
      note: 'Contact may need to be manually flagged in Qualtrics',
    });
  }

  // Update contact's embedded data to mark as opted out
  const updateRes = await fetch(
    `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/${targetContactId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        directoryUnsubscribed: true,
        embeddedData: {
          beta_opted_out: 'true',
          beta_opt_out_date: optOutDate || new Date().toISOString(),
          beta_opt_out_reason: reason || 'unknown',
          beta_opt_out_recorded_by: recordedBy || 'system',
        },
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return NextResponse.json({ success: false, error: err }, { status: updateRes.status });
  }

  return NextResponse.json({
    success: true,
    contactId: targetContactId,
    message: `Contact ${email} opted out of directory and flagged in Qualtrics`,
  });
}

// ─── Opt-Back-In Contact ──────────────────────────────────────────────────────
// Re-subscribes a contact to the directory (reverses opt-out)
async function optBackInContact(body: any) {
  const { email, contactId } = body;

  let targetContactId = contactId;

  if (!targetContactId && email) {
    const searchRes = await fetch(
      `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { filterType: 'email', comparison: 'eq', value: email } }),
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const elements = searchData.result?.elements || [];
      if (elements.length > 0) {
        targetContactId = elements[0].id;
      }
    }
  }

  if (!targetContactId) {
    return NextResponse.json({
      success: false,
      error: `Contact not found in Qualtrics directory for email: ${email}`,
    });
  }

  const updateRes = await fetch(
    `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/${targetContactId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        directoryUnsubscribed: false,
        embeddedData: {
          beta_opted_out: 'false',
          beta_opt_back_in_date: new Date().toISOString(),
        },
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return NextResponse.json({ success: false, error: err }, { status: updateRes.status });
  }

  return NextResponse.json({
    success: true,
    contactId: targetContactId,
    message: `Contact ${email} re-subscribed to directory (opted back in)`,
  });
}

// ─── Find Contact ─────────────────────────────────────────────────────────────
async function findContact(body: any) {
  const { email } = body;
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const res = await fetch(
    `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/contacts/search`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter: { filterType: 'email', comparison: 'eq', value: email } }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const elements = data.result?.elements || [];

  return NextResponse.json({
    found: elements.length > 0,
    contacts: elements,
    count: elements.length,
  });
}

// ─── List Directories (helper to find your directory ID) ──────────────────────
async function listDirectories() {
  const res = await fetch(`${QUALTRICS_BASE_URL}/directories`, { headers });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.result || data);
}
