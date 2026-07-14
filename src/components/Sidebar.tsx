import React from "react";
import { 
  LayoutDashboard, 
  BarChart3, 
  FileCheck2, 
  ShieldAlert, 
  Settings, 
  Layers, 
  Calculator, 
  Network, 
  CheckSquare, 
  Users2,
  FileSpreadsheet,
  Cpu,
  History,
  TrendingUp,
  Coins
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exceptionCount: number;
  openFindingsCount: number;
  userRole: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  exceptionCount,
  openFindingsCount,
  userRole,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const isAuditorOrAdmin = ["Administrator", "Audit Manager", "Lead Auditor", "Senior Auditor", "Auditor"].includes(userRole);

  const mainNavigation = [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard, badge: null },
  ];

  const analyticsNavigation = [
    { id: "rates", label: "Freight Rates compliance", icon: Coins },
    { id: "weights", label: "Weight & Volume Variance", icon: Calculator },
    { id: "routes", label: "Route & Distance GIS", icon: Network },
    { id: "carrier-performance", label: "Carrier SLA Scorecard", icon: BarChart3 },
    { id: "modal-cost", label: "Multi-Modal Optimizer", icon: Cpu },
  ];

  const auditWorkspaceNav = [
    { id: "exceptions", label: "Exception Queue", icon: ShieldAlert, badge: exceptionCount },
    { id: "findings", label: "Observation Findings", icon: FileCheck2, badge: openFindingsCount },
    { id: "remediations", label: "CAPA Remediation Tracker", icon: TrendingUp },
    { id: "sampling", label: "Statistical Sampling", icon: Layers },
    { id: "working-papers", label: "Working Papers (Tickmarks)", icon: FileSpreadsheet },
  ];

  const renderNavButton = (item: { id: string; label: string; icon: any; badge?: number | null }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
          isActive 
            ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title={item.label}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
        {!collapsed && (
          <span className="truncate text-left flex-1">{item.label}</span>
        )}
        {!collapsed && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            isActive ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"
          }`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`bg-white text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200 ${
      collapsed ? "w-16" : "w-64"
    }`}>
      {/* Platform Branding with Sleek Slate-900 header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 bg-slate-900 justify-between">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
              <div className="w-4 h-4 border-2 border-white rotate-45"></div>
            </div>
            <span className="font-bold text-lg text-white tracking-tight italic">
              IAOS <span className="text-blue-400 font-light text-sm not-italic ml-1 underline decoration-blue-500/50">Logistics</span>
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mx-auto rotate-45">
            <div className="w-4 h-4 border-2 border-white"></div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Workspaces */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Main Operations</p>
          )}
          <div className="space-y-1">
            {mainNavigation.map(renderNavButton)}
          </div>
        </div>

        {/* Analytics Workspace */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Analytical Compliance</p>
          )}
          <div className="space-y-1">
            {analyticsNavigation.map(renderNavButton)}
            <button
              onClick={() => setActiveTab("all-analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === "all-analytics" || [
                  "rates", "weights", "routes", "detention", "carrier-performance", 
                  "duplicates", "modal-cost", "fuel", "empty-return", "lr-pod", 
                  "provisions", "sla-transit", "claims", "placements", "cost-trends"
                ].includes(activeTab) && activeTab !== "rates" && activeTab !== "weights" && activeTab !== "routes" && activeTab !== "carrier-performance" && activeTab !== "modal-cost"
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="All 15 Analytical Modules"
            >
              <BarChart3 className={`w-5 h-5 shrink-0 ${
                activeTab === "all-analytics" || [
                  "rates", "weights", "routes", "detention", "carrier-performance", 
                  "duplicates", "modal-cost", "fuel", "empty-return", "lr-pod", 
                  "provisions", "sla-transit", "claims", "placements", "cost-trends"
                ].includes(activeTab) && activeTab !== "rates" && activeTab !== "weights" && activeTab !== "routes" && activeTab !== "carrier-performance" && activeTab !== "modal-cost"
                  ? "text-blue-600" : "text-slate-400"
              }`} />
              {!collapsed && <span className="truncate text-left flex-1">All 15 Analytics Modules</span>}
            </button>
          </div>
        </div>

        {/* Audit Objectives */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Audit Controls</p>
          )}
          <div className="space-y-1">
            {auditWorkspaceNav.map(renderNavButton)}
            <button
              onClick={() => setActiveTab("audit-universe")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === "audit-universe" || ["risk-controls", "rule-library", "connectors"].includes(activeTab)
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Audit Controls & Setup"
            >
              <Settings className={`w-5 h-5 shrink-0 ${
                activeTab === "audit-universe" || ["risk-controls", "rule-library", "connectors"].includes(activeTab)
                  ? "text-blue-600" : "text-slate-400"
              }`} />
              {!collapsed && <span className="truncate text-left flex-1">Audit Universe & Setup</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold mr-3 border border-slate-300">
              {userRole.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">Sarah Jenkins</span>
              <span className="text-[10px] text-slate-500 uppercase truncate">{userRole}</span>
            </div>
          </div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-green-500 mx-auto" title={userRole} />
        )}
      </div>
    </aside>
  );
}
