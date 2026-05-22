// ============================================================
// TEST: Simulate overdue pending return devices
// 
// HOW TO USE:
// 1. Open http://localhost:3000 in your browser
// 2. Open DevTools (Cmd + Option + J on Mac)
// 3. Paste this entire script into the Console tab
// 4. Hit Enter
// 5. Page will reload — you should see:
//    - Overdue stat card turns RED with count of 2
//    - Red overdue alerts banner appears at top
//    - Click either device serial to see the escalation UI
// ============================================================

const store = JSON.parse(localStorage.getItem('device-tracker-storage'));

// Device 1: return email sent 15 days ago (Week 2 escalation — urgent)
store.state.devices[0].status = 'pending_return';
store.state.devices[0].returnEmailSentAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
store.state.devices[0].returnEmailCount = 1;

// Device 2: return email sent 8 days ago (Week 1 escalation — follow-up)
store.state.devices[1].status = 'pending_return';
store.state.devices[1].returnEmailSentAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
store.state.devices[1].returnEmailCount = 1;

// Device 3: return email sent 2 days ago (no escalation yet — just shows status)
store.state.devices[2].status = 'pending_return';
store.state.devices[2].returnEmailSentAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
store.state.devices[2].returnEmailCount = 1;

localStorage.setItem('device-tracker-storage', JSON.stringify(store));
location.reload();
