import React, { useState } from "react";
import { 
  Bell, 
  Search, 
  UserCircle2, 
  RefreshCw, 
  Download, 
  Printer, 
  CheckCircle2,
  AlertOctagon,
  ShieldAlert
} from "lucide-react";

interface HeaderProps {
  userRole: string;
  setUserRole: (role: string) => void;
  onSearch: (query: string) => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onTriggerAudit: () => void;
  auditLoading: boolean;
  alertCount: number;
}

export default function Header({
  userRole,
  setUserRole,
  onSearch,
  onExportExcel,
  onPrint,
  onTriggerAudit,
  auditLoading,
  alertCount
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roles = [
    "Administrator",
    "Audit Manager",
    "Lead Auditor",
    "Senior Auditor",
    "Auditor",
    "Business User",
    "Viewer"
  ];

  const notifications = [
    { id: 1, text: "Duplicate freight billing risk flagged on Maersk container SH-25042.", type: "danger" },
    { id: 2, text: "Amelia Carter completed Review sign-off on DHL Rate compliant working paper.", type: "success" },
    { id: 3, text: "Transit SLA overage detected on carrier DB Schenker departing Munich Assembly.", type: "warning" },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch(val);
  };

  return (
    <header className="h-16 bg-white text-slate-800 flex items-center justify-between px-6 border-b border-slate-200 shadow-sm shrink-0 relative z-40">
      {/* Title with metadata badges & search */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex items-center space-x-3 shrink-0">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Freight Audit</h1>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex space-x-1.5">
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-semibold uppercase">FY 2026 Q3</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-semibold uppercase hidden sm:inline">Global Scope</span>
          </div>
        </div>

        {/* Global Search box */}
        <div className="relative w-48 lg:w-64 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Corporate Action Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Run Audits Trigger */}
        <button
          onClick={onTriggerAudit}
          disabled={auditLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-500/15 hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            auditLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          title="Run automated analytical rules scan on raw logistics data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? "animate-spin" : ""}`} />
          {auditLoading ? "Analyzing..." : "Run Rules Engine"}
        </button>

        {/* Export Excel Tool */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="Download current table state to CSV spreadsheet"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Excel</span>
        </button>

        {/* Print Layout */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="Trigger printer layout of active workspace"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Print</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowUserMenu(false);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white font-bold rounded-full text-[10px] flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 text-slate-800 text-left">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Alert Center</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {alertCount} Pending Tasks
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 flex gap-2">
                    {n.type === "danger" && <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    {n.type === "warning" && <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    {n.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                    <span className="text-[11px] text-slate-600 leading-normal">{n.text}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Dismiss All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role-Based Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            <UserCircle2 className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[11px] font-semibold leading-none text-slate-800"> Sarah Jenkins </span>
              <span className="text-[9px] text-slate-500 leading-none mt-0.5">{userRole}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-2 text-slate-800 text-left">
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-400 block uppercase tracking-wider">Simulate Role RBAC</span>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Changing roles shifts interface view rights.</span>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {roles.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserRole(r);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                      userRole === r ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    {r}
                    {userRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
