export function formatSalary(min, max, currency = 'USD') {
  if (!min && !max) return 'Competitive';
  const fmt = (n) => Number(n).toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'Open':
      return 'status-badge status-open';
    case 'Submitted':
      return 'status-badge status-submitted';
    case 'Under Review':
      return 'status-badge status-review';
    case 'Interview':
      return 'status-badge status-interview';
    case 'Offer':
      return 'status-badge status-offer';
    case 'Rejected':
      return 'status-badge status-rejected';
    case 'Closed':
    case 'Draft':
    default:
      return 'status-badge status-closed';
  }
}

export const APPLICATION_PIPELINE = ['Submitted', 'Under Review', 'Interview', 'Offer'];

export function getJobShareUrl(jobId) {
  if (typeof window === 'undefined') return `/jobs/${jobId}`;
  return `${window.location.origin}/jobs/${encodeURIComponent(jobId)}`;
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

