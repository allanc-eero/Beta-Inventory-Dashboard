'use client';

import { useState, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Attachment, AttachmentType } from '@/types';

const ATTACHMENT_TYPES: { value: AttachmentType; label: string }[] = [
  { value: 'rma_form', label: 'RMA Form' },
  { value: 'shipping_receipt', label: 'Shipping Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'image/gif': '🖼️',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-excel': '📊',
  'text/csv': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsPanelProps {
  deviceId?: string;
  shipmentId?: string;
}

export default function AttachmentsPanel({ deviceId, shipmentId }: AttachmentsPanelProps) {
  const { addAttachment, deleteAttachment, getAttachmentsForDevice, getAttachmentsForShipment } = useDeviceStore();
  const [showUpload, setShowUpload] = useState(false);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('other');
  const [uploadNotes, setUploadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = deviceId
    ? getAttachmentsForDevice(deviceId)
    : shipmentId
    ? getAttachmentsForShipment(shipmentId)
    : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB for localStorage
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;

      const attachment: Attachment = {
        id: crypto.randomUUID(),
        deviceId: deviceId || undefined,
        shipmentId: shipmentId || undefined,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        attachmentType,
        dataUrl,
        uploadedBy: 'Admin',
        uploadedAt: new Date().toISOString(),
        notes: uploadNotes || undefined,
      };

      addAttachment(attachment);
      setShowUpload(false);
      setUploadNotes('');
      setAttachmentType('other');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.fileName;
    link.click();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Attachments</h4>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {showUpload ? 'Cancel' : '+ Upload'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
            <select
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value as AttachmentType)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm"
            >
              {ATTACHMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm"
              placeholder="Description..."
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.gif,.xlsx,.xls,.csv,.doc,.docx,.txt"
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Max 5MB. PDF, images, Excel, Word, CSV.</p>
          </div>
        </div>
      )}

      {/* Attachments list */}
      {attachments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-md hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{FILE_ICONS[att.fileType] || '📎'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{att.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {att.attachmentType.replace(/_/g, ' ')} · {formatFileSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString()}
                  </p>
                  {att.notes && <p className="text-xs text-gray-500 truncate">{att.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleDownload(att)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteAttachment(att.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No files attached</p>
      )}
    </div>
  );
}
