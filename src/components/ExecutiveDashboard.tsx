import React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from "recharts";
import { 
  Coins, 
  ShieldAlert, 
  TrendingUp, 
  CheckSquare, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Gauge,
  AlertTriangle,
  Award
} from "lucide-react";
import { DashboardStats, Carrier, FreightInvoice } from "../types";

interface ExecutiveDashboardProps {
  stats: DashboardStats | null;
  carriers: Carrier[];
  recentInvoices: FreightInvoice[];
  setActiveTab: (tab: string) => void;
}

export default function ExecutiveDashboard({
  stats,
  carriers,
  recentInvoices,
  setActiveTab
}: ExecutiveDashboardProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs font-semibold text-slate-500">Retrieving Enterprise Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  const { kpis, trendData, carrierDistribution } = stats;

  const COLORS = ["#1e40af", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];

  // Custom visual list for regional risk heatmap
  const regionalRisks = [
    { region: "Chicago Central Plant to East Coast", score: "High Risk (92)", color: "text-red-500" },
    { region: "Munich Assembly Center to Rotterdam Port", score: "Medium Risk (64)", color: "text-amber-500" },
    { region: "Shanghai Logistics Hub to Inland Ningbo", score: "Low Risk (28)", color: "text-emerald-500" },
    { region: "Mumbai Inland Depot to Nhava Sheva (Inflated)", score: "High Risk (87)", color: "text-red-500" },
    { region: "São Paulo Logistics to Santos Terminal", score: "Low Risk (14)", color: "text-emerald-500" }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Welcome Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">IAOS – Logistics & Freight Audit Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-dimensional analysis, rate compliance auditing, and carrier performance intelligence dashboard.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Audit Horizon</span>
            <span className="text-xs font-bold text-slate-800">Q2 2026 Fiscal Year</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Platform Mode</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Auditing
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Audited Billing</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">${kpis.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-bold text-red-500">+12.4%</span> vs previous month
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Total Recoverable */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Recoverable Leakage</span>
            <span className="text-2xl font-bold text-red-600 font-mono">${kpis.totalRecoverable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold text-emerald-500">22.8%</span> rate error recovery action
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Exceptions */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Exceptions Queue</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{kpis.activeExceptions} <span className="text-xs text-slate-400 font-sans">Open</span></span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="font-bold text-amber-500">{kpis.totalExceptions}</span> total system anomalies flagged
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">SLA On-Time Transit</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{kpis.slaCompliance}%</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              Goal: <span className="font-bold text-blue-600">95.0%</span> compliance floor
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md">
            <Gauge className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart: Billing & Leakage Trends (Area) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Freight Billing & Recovery Trends</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Chronological summary of total billed freight costs versus audit leakages captured.</p>
            </div>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">Monthly Rollups</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area name="Total Billed ($)" type="monotone" dataKey="billed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBilled)" strokeWidth={2} />
                <Area name="Recovered Savings ($)" type="monotone" dataKey="recovered" stroke="#ef4444" fillOpacity={1} fill="url(#colorRecovered)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carrier Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Carrier Spend Allocation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Total freight bill spend distribution across active carriers.</p>
            </div>
          </div>
          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={carrierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {carrierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold font-mono text-slate-900">
                ${carrierDistribution.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          {/* Spend Legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
            {carrierDistribution.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Dashboard bento section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Interactive Route Risks Hotspots (GIS Map Representation) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Geographical GIS Route Risks</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Active monitoring of billing inflation and route compliance hot spots.</p>
          </div>
          {/* Simulated Map Visual container */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="space-y-3 relative z-10">
              {regionalRisks.map(r => (
                <div key={r.region} className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-600 truncate max-w-[200px]">{r.region}</span>
                  <span className={`font-mono font-bold text-[11px] shrink-0 ${r.color}`}>{r.score}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-900/10 p-3 rounded-md border border-blue-200/60 flex items-start gap-2 relative z-10">
              <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-blue-800 leading-normal">
                <span className="font-bold">Risk Action Recommendation:</span> Route inflation checking on <strong>Mumbai Inland</strong> and <strong>Chicago Central</strong> are set to audit 100% of billing logs due to GIS variances exceeding standard thresholds by 15%+.
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Carrier Performance Rating & Rankings */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Carrier SLA Performance ranking</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Rankings based on on-time delivery, cargo damage rates, and billing accuracy.</p>
            </div>
            <button 
              onClick={() => setActiveTab("carrier-performance")}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Analyze SLA
            </button>
          </div>
          <div className="space-y-3">
            {carriers.slice(0, 5).map((c, index) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  index === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                  index === 1 ? "bg-slate-100 text-slate-800 border border-slate-300" :
                  index === 2 ? "bg-amber-50 text-amber-900 border border-amber-200" :
                  "bg-slate-50 text-slate-500"
                }`}>
                  {c.ranking}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs text-slate-800 block truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-400 block">On-Time SLA: {c.onTimeRate}%</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-900 block">{c.performanceScore}</span>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Score</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-Time Audit Coverage Indicators */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">System Operations & Verification</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Core platform database coverage, control objectives validation rates.</p>
          </div>
          <div className="space-y-4">
            {/* Audit Coverage Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Digital Audit Universe Coverage</span>
                <span className="font-mono font-bold text-slate-900">{kpis.auditCoveragePercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${kpis.auditCoveragePercent}%` }}></div>
              </div>
            </div>

            {/* Findings Resolve Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Finding Remediation Resolve Rate</span>
                <span className="font-mono font-bold text-slate-900">
                  {parseFloat((( (kpis.findingsCoverage - kpis.unresolvedFindings) / (kpis.findingsCoverage || 1)) * 100).toFixed(1))}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${((kpis.findingsCoverage - kpis.unresolvedFindings) / (kpis.findingsCoverage || 1)) * 100}%` }}></div>
              </div>
            </div>

            {/* Accruals Variance Accuracy */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Accruals vs Billing Difference</span>
                <span className="font-mono font-bold text-red-500">
                  ${kpis.accrualVariance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Extra alert ribbon */}
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-500 leading-normal">
                Continuous monitoring active. Total <strong>{kpis.totalExceptions} Exceptions</strong> parsed automatically. <strong>{kpis.unresolvedFindings} findings</strong> require urgent operational sign-off.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Live Recent Exceptions Overview List */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Disputed Billing & Rate Compliance Log</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Showing recent freight bills marked for audit dispute based on analytical compliance rules.</p>
          </div>
          <button 
            onClick={() => setActiveTab("exceptions")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded transition-colors"
          >
            Review Exceptions Queue
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase text-slate-400 font-bold">
                <th className="py-3 px-2">Invoice No</th>
                <th className="py-3 px-2">Carrier</th>
                <th className="py-3 px-2">Plant / Location</th>
                <th className="py-3 px-2">Total Billed</th>
                <th className="py-3 px-2">Contract Rate</th>
                <th className="py-3 px-2">Billed Rate</th>
                <th className="py-3 px-2">Leakage Variance</th>
                <th className="py-3 px-2">SLA</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {recentInvoices.slice(0, 5).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-2 font-semibold text-slate-800">{inv.carrierName}</td>
                  <td className="py-3 px-2 text-slate-600">{inv.plantName}</td>
                  <td className="py-3 px-2 font-mono font-bold">${inv.totalBilledAmount.toLocaleString()}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">${inv.contractRate}</td>
                  <td className="py-3 px-2 font-mono text-red-600">${inv.billedRate}</td>
                  <td className="py-3 px-2 font-mono">
                    {inv.rateVariance > 0 ? (
                      <span className="text-red-600 font-bold">+${inv.rateVariance}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {inv.isLate ? (
                      <span className="bg-red-50 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded">Late</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded">On Time</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button 
                      onClick={() => setActiveTab("rates")}
                      className="px-2 py-0.5 border border-blue-600 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-50 transition-colors"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
