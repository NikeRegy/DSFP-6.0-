import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Clock,
  Layers,
  Briefcase
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView({
  analytics,
  range = 'all',
  onRangeChange
}) {
  const data = analytics || {
    totalApplications: 0,
    byStatus: {},
    byMonth: [],
    byCategory: [],
    byCompany: [],
    byEmploymentType: [],
    interviewConversionRate: 0,
    offerConversionRate: 0,
    rejectionRate: 0,
    avgResponseDays: null
  };

  const statusOrder = [
    'Saved',
    'Applied',
    'Under Review',
    'Shortlisted',
    'Assessment',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn'
  ];

  const maxMonthCount = Math.max(...(data.byMonth || []).map((m) => m.count), 1);
  const maxCategoryCount = Math.max(...(data.byCategory || []).map((c) => c.count), 1);
  const maxCompanyCount = Math.max(...(data.byCompany || []).map((c) => c.count), 1);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Job Search Analytics &amp; Performance</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Transparent conversion rates, response timelines, and stage distributions derived from your application history.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={range}
            onChange={(e) => onRangeChange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last 1 Year</option>
          </select>

          <a
            href={api.getApplicationsExportUrl()}
            download="jobify_applications_analytics.csv"
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} />
            Export History (CSV)
          </a>
        </div>
      </div>

      {/* KPI Conversion Rate Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{data.totalApplications}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Submitted within selected period
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Interview Conversion</div>
          <div className="stat-value" style={{ color: 'var(--primary-600)' }}>
            {data.interviewConversionRate}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            (Interviews &amp; Offers) &divide; Applications
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Offer Conversion</div>
          <div className="stat-value" style={{ color: '#166534' }}>
            {data.offerConversionRate}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Confirmed Offers &divide; Applications
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Rejection Rate</div>
          <div className="stat-value" style={{ color: 'var(--text-rose)' }}>
            {data.rejectionRate}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Unsuccessful &divide; Applications
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="dashboard-grid-2">
        {/* Application Funnel & Status Distribution */}
        <div className="analytics-chart-card">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Application Pipeline Distribution
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Breakdown across the 9 pipeline stages
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {statusOrder.map((status) => {
              const count = data.byStatus?.[status] || 0;
              const percent = data.totalApplications > 0 ? ((count / data.totalApplications) * 100).toFixed(0) : 0;

              return (
                <div key={status} className="chart-bar-row">
                  <div className="chart-bar-label" title={status}>
                    {status}
                  </div>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="chart-bar-value">
                    {count} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.74rem' }}>({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications Over Time (By Month) */}
        <div className="analytics-chart-card">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Applications Over Time
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Submission volume grouped by calendar month
            </p>
          </div>

          {(!data.byMonth || data.byMonth.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No applications submitted in this timeframe.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.byMonth.map((item) => {
                const percent = ((item.count / maxMonthCount) * 100).toFixed(0);
                return (
                  <div key={item.month} className="chart-bar-row">
                    <div className="chart-bar-label">{item.month}</div>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="chart-bar-value">{item.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Applications by Category / Department */}
        <div className="analytics-chart-card">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Applications by Department
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Target roles categorized by specialty
            </p>
          </div>

          {(!data.byCategory || data.byCategory.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No department data available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.byCategory.map((item) => {
                const percent = ((item.count / maxCategoryCount) * 100).toFixed(0);
                return (
                  <div key={item.category} className="chart-bar-row">
                    <div className="chart-bar-label">{item.category}</div>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="chart-bar-value">{item.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Target Companies */}
        <div className="analytics-chart-card">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Top Companies Applied To
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Organizations with the highest application frequency
            </p>
          </div>

          {(!data.byCompany || data.byCompany.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No company data available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.byCompany.slice(0, 6).map((item) => {
                const percent = ((item.count / maxCompanyCount) * 100).toFixed(0);
                return (
                  <div key={item.company} className="chart-bar-row">
                    <div className="chart-bar-label">{item.company}</div>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="chart-bar-value">{item.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
