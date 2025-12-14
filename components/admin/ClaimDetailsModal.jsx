// frontend/components/admin/ClaimDetailsModal.jsx
'use client';
import { useEffect, useState } from 'react';
import apiClient from '../../utils/apiClient';

export default function ClaimDetailsModal({
  claim,
  onClose,
  onApprove,
  onReject
}) {
  const [adminNote, setAdminNote] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showApproveBox, setShowApproveBox] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* ESC to close */
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!claim) return null;

  const isActionable =
    claim.status === 'pending' || claim.status === 'pending_review';

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString() : '—';

  /* 📎 Secure Download (Admin + HttpOnly) */
  async function handleDownload() {
    try {
      setDownloading(true);

      const res = await apiClient.get(
        `/admin/claims/${claim.id}/document`,
        { responseType: 'blob' }
      );

      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download =
        claim.document_url?.split('/').pop() || 'ownership_document';
      a.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('❌ Download error:', err);
      alert('❌ Unable to download document.');
    } finally {
      setDownloading(false);
    }
  }

  /* ✅ Approve */
  async function handleApprove() {
    if (!adminNote.trim()) {
      return setErrorMsg('⚠️ Approval note is required.');
    }

    setActionLoading(true);
    setErrorMsg('');
    await onApprove(adminNote);
    setActionLoading(false);
  }

  /* ❌ Reject */
  async function handleReject() {
    if (!adminNote.trim()) {
      return setErrorMsg('⚠️ Rejection reason is required.');
    }

    setActionLoading(true);
    setErrorMsg('');
    await onReject(adminNote);
    setActionLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="admin-section relative w-[90%] md:w-[600px] bg-[var(--card-bg)] text-[var(--text)] rounded-xl shadow-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--card-bg)] z-10">
          <h2 className="admin-title text-lg font-semibold">
            Claim Details
          </h2>
          <button
            onClick={onClose}
            className="text-xl font-bold hover:text-turquoise"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-sm overflow-y-auto pr-1 flex-grow">
          <div><strong>Business:</strong> {claim.business_name}</div>
          <div><strong>Applicant:</strong> {claim.full_name || '—'}</div>
          <div><strong>Email:</strong> {claim.email}</div>
          <div><strong>Phone:</strong> {claim.phone || '—'}</div>
          <div><strong>Description:</strong> {claim.description || '—'}</div>

          {claim.document_url && (
            <div>
              <strong>Ownership Document:</strong>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="admin-btn admin-btn-primary mt-2"
              >
                {downloading ? 'Downloading…' : '📎 Download Document'}
              </button>
            </div>
          )}

          <div className="flex justify-between text-xs border-t pt-3 mt-4">
            <span>Status: {claim.status}</span>
            <span>Created: {formatDate(claim.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 bg-[var(--card-bg)]">
          {errorMsg && (
            <p className="text-red-500 text-xs text-center mb-2">
              {errorMsg}
            </p>
          )}

          {isActionable ? (
            showApproveBox || showRejectBox ? (
              <>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="admin-input w-full h-24 resize-none"
                  placeholder={
                    showApproveBox
                      ? 'Approval note…'
                      : 'Rejection reason…'
                  }
                />
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setShowApproveBox(false);
                      setShowRejectBox(false);
                      setAdminNote('');
                      setErrorMsg('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading}
                    className="admin-btn admin-btn-primary"
                    onClick={showApproveBox ? handleApprove : handleReject}
                  >
                    {actionLoading ? 'Processing…' : 'Confirm'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowRejectBox(true)}
                >
                  Reject
                </button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => setShowApproveBox(true)}
                >
                  Approve
                </button>
              </div>
            )
          ) : (
            <p className="text-sm text-center text-gray-500">
              This claim has already been processed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
