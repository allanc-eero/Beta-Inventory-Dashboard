'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle, X } from 'lucide-react';

interface JiraToastProps {
  ticketKey: string;
  summary: string;
  epicKey?: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function JiraToast({ ticketKey, summary, epicKey, onClose, autoCloseMs = 8000 }: JiraToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // allow fade-out animation
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const jiraUrl = `https://eeroinc.atlassian.net/browse/${ticketKey}`;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] max-w-md bg-white border border-green-200 rounded-xl shadow-2xl p-4 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">JIRA Ticket Created</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{summary}</p>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {ticketKey}
              <ExternalLink className="w-3 h-3" />
            </a>
            {epicKey && (
              <span className="text-xs text-gray-400">in epic {epicKey}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
