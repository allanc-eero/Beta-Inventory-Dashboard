'use client';

import { useState, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { Attachment, AttachmentType } from '@/types';
import { Card, Button, Select, Input } from '@amzn/eero-web-design-components';

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
  const { canEdit } = useAuthStore();
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
    <Card
      size={2}
      title={
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Attachments</span>
          {canEdit() && (
            <Button
              type="text"
              label={showUpload ? 'Cancel' : '+ Upload'}
              onClick={() => setShowUpload(!showUpload)}
            />
          )}
        </div>
      }
    >
      {/* Upload form */}
      {showUpload && (
        <div className="mb-4 p-3 bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)] space-y-3">
          <Select
            id="attachment-type"
            label="Document Type"
            value={attachmentType}
            onChange={(value) => setAttachmentType(value as AttachmentType)}
            options={ATTACHMENT_TYPES}
            layout="vertical"
          />

          <Input
            id="attachment-notes"
            label="Notes (optional)"
            value={uploadNotes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploadNotes(e.target.value)}
            placeholder="Description..."
            layout="vertical"
          />

          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.gif,.xlsx,.xls,.csv,.doc,.docx,.txt"
              className="w-full text-xs text-[var(--ui-text-text-tertiary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[var(--ui-support-fill-support-info)] file:text-[var(--ui-support-text-icon-support-info)]"
            />
            <p className="text-xs text-[var(--ui-text-text-placeholder)] mt-1">Max 5MB. PDF, images, Excel, Word, CSV.</p>
          </div>
        </div>
      )}

      {/* Attachments list */}
      {attachments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-2 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-md hover:bg-[var(--ui-background-layer-layer-page-hover)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{FILE_ICONS[att.fileType] || '📎'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ui-text-text-primary)] truncate">{att.fileName}</p>
                  <p className="text-xs text-[var(--ui-text-text-placeholder)]">
                    {att.attachmentType.replace(/_/g, ' ')} · {formatFileSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString()}
                  </p>
                  {att.notes && <p className="text-xs text-[var(--ui-text-text-tertiary)] truncate">{att.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button type="text" label="Download" onClick={() => handleDownload(att)} />
                {canEdit() && (
                  <Button type="text" danger label="×" ariaLabel="Delete attachment" onClick={() => deleteAttachment(att.id)} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--ui-text-text-placeholder)]">No files attached</p>
      )}
    </Card>
  );
}
