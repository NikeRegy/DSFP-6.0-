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

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - d) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(iso);
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'Saved':
      return 'status-badge status-saved';
    case 'Open':
    case 'Applied / Submitted':
    case 'Submitted':
      return 'status-badge status-submitted';
    case 'Under Review':
      return 'status-badge status-review';
    case 'Shortlisted':
      return 'status-badge status-shortlisted';
    case 'Assessment':
      return 'status-badge status-assessment';
    case 'Interview':
      return 'status-badge status-interview';
    case 'Offer':
      return 'status-badge status-offer';
    case 'Rejected':
      return 'status-badge status-rejected';
    case 'Withdrawn':
      return 'status-badge status-withdrawn';
    case 'Closed':
    case 'Draft':
    default:
      return 'status-badge status-closed';
  }
}

export function savedCategoryClass(category) {
  switch (category) {
    case 'Priority':
      return 'badge-cat badge-cat-priority';
    case 'Planning to Apply':
      return 'badge-cat badge-cat-planning';
    case 'Interested':
      return 'badge-cat badge-cat-interested';
    case 'Not Interested':
    default:
      return 'badge-cat badge-cat-not';
  }
}

export const APPLICATION_PIPELINE = [
  'Saved',
  'Applied / Submitted',
  'Under Review',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Offer'
];

export const ALL_APPLICATION_STATUSES = [
  'Saved',
  'Applied / Submitted',
  'Under Review',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

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
