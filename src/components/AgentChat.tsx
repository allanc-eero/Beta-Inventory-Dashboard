'use client';

import { useState, useRef, useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { usePackagesStore } from '@/store/packagesStore';
import { Sparkles, Send, X } from 'lucide-react';

// Simple markdown-like formatting for agent responses
function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { devices, testerProfiles, getClosedPrograms, getAllShipments, jiraTickets } = useDeviceStore();
  const { shapeshiftJobs, serviceOrders, inboundPackages, outboundPackages } = usePackagesStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Build context summary for the LLM
  const buildContext = () => {
    const onlineCount = devices.filter((d) => d.status === 'online').length;
    const offlineCount = devices.filter((d) => d.status === 'not_online').length;
    const deactivatedCount = devices.filter((d) => d.status === 'deactivated').length;
    const pendingReturnCount = devices.filter((d) => d.status === 'pending_return').length;
    const programs = [...new Set(devices.map((d) => d.program).filter(Boolean))];
    const countries = [...new Set(devices.map((d) => d.country).filter(Boolean))];

    // ALL devices — full data
    const allDevices = devices.map((d) => ({
      serial: d.serialNumber,
      name: d.assignedTo || d.checkedOutTo || '',
      email: d.assignedEmail || '',
      status: d.status,
      program: d.program,
      product: d.product,
      model: d.model,
      internalName: d.internalName,
      country: d.country,
      location: d.location,
      firmware: d.firmwareVersion,
      network: d.network,
      tracking: d.tracking || d.leg2Tracking || '',
      dueDate: d.dueDate || '',
      deactivated: d.deactivated,
      returnEmailSentAt: d.returnEmailSentAt || '',
      testbedName: d.testbedName || '',
    }));

    // ALL tester profiles
    const allTesters = testerProfiles.map((t) => ({
      name: t.name,
      email: t.email,
      testerId: t.testerId,
      country: t.country,
      location: t.location,
      programs: t.programs,
      networkId: t.networkId,
      adminId: t.adminId,
      additionalEmails: t.additionalEmails,
    }));

    // Recent device history (last 200 entries)
    const { deviceHistory, getOptOuts, getAllShipments: getShipments } = useDeviceStore.getState();
    const recentHistory = deviceHistory
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 200)
      .map((h: any) => {
        const dev = devices.find((d) => d.id === h.deviceId);
        return { serial: dev?.serialNumber || '', action: h.action, description: h.description, user: h.user, date: h.timestamp };
      });

    // Opt-outs
    const optOuts = getOptOuts().map((o: any) => ({ name: o.personName, email: o.personEmail, reason: o.reason, date: o.optOutDate, program: o.program }));

    // Shipments
    const shipments = getShipments().slice(0, 20).map((s: any) => ({ fileName: s.fileName, carrier: s.carrier, devices: s.serials?.length, program: s.program, date: s.createdAt, status: s.status }));

    return JSON.stringify({
      stats: { total: devices.length, online: onlineCount, offline: offlineCount, deactivated: deactivatedCount, pendingReturn: pendingReturnCount, programs, countries, testerCount: testerProfiles.length },
      devices: allDevices,
      testers: allTesters,
      recentActivity: recentHistory,
      optOuts,
      shipments,
      shapeshiftJobs: shapeshiftJobs.map((j) => ({ serial: j.serial, target: j.targetEnv, status: j.status, assignedTo: j.assignedTo, retries: j.retries, created: j.createdAt })),
      serviceOrders: serviceOrders.map((o) => ({ title: o.title, status: o.status, type: o.type, jiraKey: o.jiraKey, assignee: o.assignee, site: o.site })),
      inboundPackages: inboundPackages.map((p) => ({ asn: p.asn, carrier: p.carrier, tracking: p.trackingNumber, models: p.models, items: p.itemsTotal, status: p.status, destination: p.destination })),
      outboundPackages: outboundPackages.map((p) => ({ id: p.shippingId, recipient: p.recipient, carrier: p.carrier, tracking: p.trackingNumber, models: p.models, status: p.status, destination: p.destination })),
    });
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input.trim(), context: buildContext() }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer || 'No response.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ Failed to connect to the AI agent. Check your AWS credentials.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="relative flex-1 min-w-[250px]">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all bg-white"
        >
          <Sparkles size={16} className="text-blue-500" />
          Ask the AI agent anything...
          <kbd className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-400">⌘K</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#2c3e7a] to-blue-600">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-sm font-medium text-white">AI Agent</span>
            <span className="text-xs text-white/60">powered by Claude</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles size={32} className="mx-auto mb-3 text-blue-300" />
              <p className="text-sm text-gray-500 mb-4">Ask me anything about your devices, testers, programs, or processes.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'How many devices are online?',
                  'Who has the most devices?',
                  'Show offline devices in EU',
                  'What programs are active?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about devices, testers, programs..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
