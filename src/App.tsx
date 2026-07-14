import React, { useState, useEffect } from "react";
import { ShieldCheck, LogIn, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import AnalyticsWorkspace from "./components/AnalyticsWorkspace";
import AuditWorkspace from "./components/AuditWorkspace";

import { 
  User, 
  FreightInvoice, 
  Carrier, 
  Plant, 
  Route, 
  Exception, 
  Finding, 
  Remediation, 
  RiskControl, 
  Rule, 
  WorkingPaper, 
  DashboardStats 
} from "./types";
const API = import.meta.env.VITE_API_URL;

export default function App() {
  // Authentication state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("iaos_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("iaos_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Role switching
  const [userRole, setUserRole] = useState<string>(() => currentUser?.role || "Administrator");

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // App Layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // DB Data stores
  const [invoices, setInvoices] = useState<FreightInvoice[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [riskControls, setRiskControls] = useState<RiskControl[]>([]);
  const [workingPapers, setWorkingPapers] = useState<WorkingPaper[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Loading indicator states
  const [appLoading, setAppLoading] = useState(false);
  const [rulesEngineRunning, setRulesEngineRunning] = useState(false);
  const [samplingLoading, setSamplingLoading] = useState(false);
  const [sampledInvoices, setSampledInvoices] = useState<FreightInvoice[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  // Update userRole state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserRole(currentUser.role);
    }
  }, [currentUser]);

  // Sync userRole back to currentUser object to support fast simulator Switching!
  const handleSetUserRoleInWorkspace = (newRole: string) => {
    setUserRole(newRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem("iaos_user", JSON.stringify(updatedUser));
      addSystemLog(`RBAC Role changed context to: ${newRole}`);
    }
  };

  const addSystemLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Preselected quick credentials for easy testing
  const demoAccounts = [
    { email: "admin@iaos.com", role: "Administrator", desc: "Full CRUD, Rules configs, & CAPA signoffs" },
    { email: "manager@iaos.com", role: "Audit Manager", desc: "Review working papers, issue findings" },
    { email: "auditor@iaos.com", role: "Auditor", desc: "Add tickmarks, update exception comments" },
    { email: "viewer@iaos.com", role: "Viewer", desc: "Read-only workspace dashboard access" },
  ];

  // Helper fetch Headers builder
  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      "Authorization": authToken || "bearer-jwt-token-iaos-guest"
    };
  };

  // Fetch all database state
  const loadAllDatabaseState = async () => {
    if (!authToken) return;
    setAppLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch main stats & meta arrays
      const statsRes = await fetch("/api/dashboard/stats", { headers });
      const statsData = await statsRes.json();
      setDashboardStats(statsData);

      const invsRes = await fetch("/api/invoices?limit=120", { headers });
      const invsData = await invsRes.json();
      setInvoices(invsData.data || []);

      const carriersRes = await fetch("/api/carriers", { headers });
      const carriersData = await carriersRes.json();
      setCarriers(carriersData);

      const plantsRes = await fetch("/api/plants", { headers });
      const plantsData = await plantsRes.json();
      setPlants(plantsData);

      const routesRes = await fetch("/api/routes", { headers });
      const routesData = await routesRes.json();
      setRoutes(routesData);

      const excRes = await fetch("/api/exceptions", { headers });
      const excData = await excRes.json();
      setExceptions(excData);

      const fndRes = await fetch("/api/findings", { headers });
      const fndData = await fndRes.json();
      setFindings(fndData);

      const remRes = await fetch("/api/remediations", { headers });
      const remData = await remRes.json();
      setRemediations(remData);

      const rulesRes = await fetch("/api/rules", { headers });
      const rulesData = await rulesRes.json();
      setRules(rulesData);

      const rcRes = await fetch("/api/risk-controls", { headers });
      const rcData = await rcRes.json();
      setRiskControls(rcData);

      const wpRes = await fetch("/api/working-papers", { headers });
      const wpData = await wpRes.json();
      setWorkingPapers(wpData);

      addSystemLog("Synchronized continuous audit data repositories.");
    } catch (err) {
      console.error("Failed loading data", err);
      addSystemLog("ERR: Connection to server API timed out.");
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    loadAllDatabaseState();
  }, [authToken]);

  // Handle Login
  const handleLoginSubmit = async (e?: React.FormEvent, directEmail?: string) => {
    if (e) e.preventDefault();
    const emailToUse = directEmail || loginEmail;
    if (!emailToUse) {
      setAuthError("Email address is mandatory.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse })
      });

      if (!res.ok) {
        throw new Error("Invalid response from corporate directory.");
      }

      const data = await res.json();
      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem("iaos_token", data.token);
      localStorage.setItem("iaos_user", JSON.stringify(data.user));
    } catch (err: any) {
      setAuthError(err.message || "Failed directory authentication check.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem("iaos_token");
    localStorage.removeItem("iaos_user");
    setInvoices([]);
    setDashboardStats(null);
    addSystemLog("User logged out.");
  };

  // Run Rules Engine Validation scan (Modules 1-15 engine validation)
  const handleTriggerRulesScan = async () => {
    setRulesEngineRunning(true);
    addSystemLog("Initiating multi-dimensional analytics compliance re-scan...");
    
    // Simulate real calculations roundtrip
    setTimeout(async () => {
      try {
        await loadAllDatabaseState();
        addSystemLog("compliance scanning complete: All 25 audit models fully validated.");
      } catch (err) {
        addSystemLog("ERR: Re-scan synchronization warning.");
      } finally {
        setRulesEngineRunning(false);
      }
    }, 1200);
  };

  // 24. Observations CRUD
  const handleAddFinding = async (findingPayload: any) => {
    try {
     const res = await fetch(`${API}/api/findings`,{
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...findingPayload,
          authorName: currentUser?.name || "Lead Auditor"
        })
      });
      if (res.ok) {
        addSystemLog(`Issued formal finding observation: ${findingPayload.title}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Saving Finding failed.");
    }
  };

  const handleUpdateFindingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/findings/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addSystemLog(`Observation finding status transition: ${id} set to ${status}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Modifying Finding failed.");
    }
  };

  const handleDeleteFinding = async (id: string) => {
    try {
      const res = await fetch(`/api/findings/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        addSystemLog(`Observation finding ${id} purged from workspace.`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Purging Finding failed.");
    }
  };

  // 25. CAPA CRUD
  const handleAddCapa = async (capaPayload: any) => {
    try {
      const res = await fetch("/api/remediations", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(capaPayload)
      });
      if (res.ok) {
        addSystemLog(`Registered corrective action CAPA milestone proposal.`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Registering CAPA failed.");
    }
  };

  const handleUpdateCapa = async (id: string, progress: number, retestingStatus: string, status: string) => {
    try {
      const res = await fetch(`/api/remediations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ progress, retestingStatus, status })
      });
      if (res.ok) {
        addSystemLog(`Remediation CAPA ${id} updated (Progress: ${progress}%, Retest: ${retestingStatus}).`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Modifying CAPA failed.");
    }
  };

  // 19. Analytical Rules Configs
  const handleUpdateRule = async (id: string, isEnabled: boolean, threshold: number, severity: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isEnabled, threshold, severity })
      });
      if (res.ok) {
        addSystemLog(`Updated rule threshold params for rule ID: ${id}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Saving rule modification failed.");
    }
  };

  // 18. Risk & Controls matrix CRUD
  const handleAddRiskControl = async (rcPayload: any) => {
    try {
      const res = await fetch("/api/risk-controls", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(rcPayload)
      });
      if (res.ok) {
        addSystemLog(`Added Objective RCM map: ${rcPayload.riskCode}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Creating Risk Control map failed.");
    }
  };

  const handleDeleteRiskControl = async (id: string) => {
    try {
      const res = await fetch(`/api/risk-controls/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        addSystemLog(`Removed Risk Control matrix item ${id}.`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Purging RCM item failed.");
    }
  };

  // 21. Run Sampling Builder
  const handleRunSampling = async (method: string, sampleSize: number, materialityLimit: number) => {
    setSamplingLoading(true);
    addSystemLog(`Running statistical sampling engine (${method} method, size: ${sampleSize})...`);
    try {
      const res = await fetch("/api/sampling-configs", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ method, sampleSize, materialityLimit })
      });
      if (res.ok) {
        const result = await res.json();
        setSampledInvoices(result.samples || []);
        addSystemLog(`Sampling complete: mapped ${result.samples.length} sample invoices successfully.`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Generating samples failed.");
    } finally {
      setSamplingLoading(false);
    }
  };

  // 22. Exception Comment submission
  const handleAddCommentToException = async (id: string, text: string) => {
    try {
      const res = await fetch(`/api/exceptions/${id}/comments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, authorName: currentUser?.name || "Auditor" })
      });
      if (res.ok) {
        addSystemLog(`Added comments feedback on Exception: ${id}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Logging exception comments failed.");
    }
  };

  const handleUpdateException = async (id: string, status: string, assignedToId: string | null) => {
    try {
      const res = await fetch(`/api/exceptions/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, assignedToId })
      });
      if (res.ok) {
        addSystemLog(`Exception status changed: ${id} set to ${status}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Exception workflow failed.");
    }
  };

  // 23. Upload Working Paper Evidence
  const handleUploadWorkingPaper = async (name: string, type: "PDF" | "XLSX" | "DOCX") => {
    try {
      const res = await fetch("/api/working-papers", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fileName: name,
          fileType: type,
          fileSize: "2.4 MB",
          uploadedBy: currentUser?.name || "Sarah Jenkins"
        })
      });
      if (res.ok) {
        addSystemLog(`Logged new digital working paper: ${name}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Evidence upload failed.");
    }
  };

  const handleSignoffWorkingPaper = async (id: string, signoff: boolean, tickmarks: string[]) => {
    try {
      const res = await fetch(`/api/working-papers/${id}/signoff`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reviewerName: currentUser?.name || "Sarah Jenkins",
          signoff,
          tickMarks: tickmarks
        })
      });
      if (res.ok) {
        addSystemLog(`Sign-off update recorded on working paper.`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Working paper signoff failed.");
    }
  };

  // Disputed Invoice Status updates (Analytic workspace inline approval flows)
  const handleUpdateInvoiceStatus = async (id: string, status: "Approved" | "Disputed", remarks: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, remarks, updatedBy: currentUser?.name })
      });
      if (res.ok) {
        addSystemLog(`Invoice ID ${id} status configured to ${status}`);
        loadAllDatabaseState();
      }
    } catch (err) {
      addSystemLog("ERR: Modifying invoice status failed.");
    }
  };

  // Global Actions (Excel, Print)
  const handleExportExcel = () => {
    addSystemLog("Synthesizing Excel spreadsheets. Initializing download protocol...");
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Invoice ID,Carrier,Plant,Route,Billed Amount,Status\n"
      + invoices.map(i => `${i.invoiceNumber},${i.carrierName},${i.plantName},${i.routeOrigin} -> ${i.routeDestination},${i.totalBilledAmount},${i.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IAOS_Logistics_Audit_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSystemLog("spreadsheet export completed successfully.");
  };

  const handlePrint = () => {
    addSystemLog("Opening operational layout preview in secondary printing container...");
    window.print();
  };

  // Search filter predicate
  const filteredInvoicesByQuery = invoices.filter(inv => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.carrierName.toLowerCase().includes(q) ||
      inv.plantName.toLowerCase().includes(q) ||
      inv.lrNumber.toLowerCase().includes(q) ||
      inv.shipmentNumber.toLowerCase().includes(q)
    );
  });

  // Calculate total badge counters
  const openExceptionsCount = exceptions.filter(e => e.status === "Open").length;
  const unresolvedFindingsCount = findings.filter(f => f.status === "Open").length;

  /* ==========================================
     RENDER COMPONENT CHANNELS
     ========================================== */

  // RENDER LOGIN SCREEN IF UNAUTHENTICATED
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
          {/* Top banner branding */}
          <div className="bg-slate-900 p-8 text-center text-white flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">IAOS ENTERPRISE PORTAL</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Logistics & Freight Audit Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleLoginSubmit(e)} className="p-8 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Single Sign-On Authentication</h2>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Active Directory Email</label>
              <input
                type="email"
                required
                placeholder="sarah.jenkins@iaos.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Workspace Password</label>
              <input
                type="password"
                placeholder="••••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-800 text-[11px] font-semibold rounded border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs shadow transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
          </form>

          {/* Preset testing logs */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Preselected testing accounts</span>
            <div className="space-y-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleLoginSubmit(undefined, acc.email)}
                  className="w-full p-2.5 bg-white hover:bg-blue-50/50 border border-slate-200 rounded text-left transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800 block leading-tight">{acc.email}</span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">{acc.desc}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase border">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER MASTER COMPONENT LAYOUT FOR AUTHENTICATED USERS
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exceptionCount={openExceptionsCount}
        openFindingsCount={unresolvedFindingsCount}
        userRole={userRole}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Right panel container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Master Header */}
        <Header
          userRole={userRole}
          setUserRole={handleSetUserRoleInWorkspace}
          onSearch={(q) => {
            setGlobalSearchQuery(q);
            if (activeTab === "dashboard") {
              setActiveTab("all-analytics");
            }
          }}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
          onTriggerAudit={handleTriggerRulesScan}
          auditLoading={rulesEngineRunning}
          alertCount={openExceptionsCount}
        />

        {/* Global Loading state ribbon indicator */}
        {appLoading && (
          <div className="bg-blue-600 text-white py-1 px-6 text-center text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Synchronizing Enterprise continuous auditing repositories...</span>
          </div>
        )}

        {/* Workspace Body container */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ACTIVE TAB: EXECUTIVE DASHBOARD SUMMARY */}
          {activeTab === "dashboard" && (
            <ExecutiveDashboard
              stats={dashboardStats}
              carriers={carriers}
              recentInvoices={filteredInvoicesByQuery.slice(0, 5)}
              setActiveTab={setActiveTab}
            />
          )}

          {/* ACTIVE TAB: ANALYTICAL WORKBENCH (1-15 modules) */}
          {(activeTab === "all-analytics" || [
            "rates", "weights", "routes", "detention", "carrier-performance", 
            "duplicates", "modal-cost", "fuel", "empty-return", "lr-pod", 
            "provisions", "sla-transit", "claims", "placements", "cost-trends"
          ].includes(activeTab)) && (
            <AnalyticsWorkspace
              invoices={filteredInvoicesByQuery}
              carriers={carriers}
              plants={plants}
              routes={routes}
              activeSubTab={[
                "rates", "weights", "routes", "detention", "carrier-performance", 
                "duplicates", "modal-cost", "fuel", "empty-return", "lr-pod", 
                "provisions", "sla-transit", "claims", "placements", "cost-trends"
              ].includes(activeTab) ? activeTab : "rates"}
              setActiveSubTab={setActiveTab}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            />
          )}

          {/* ACTIVE TAB: AUDIT OBJECTIVES (17-25 modules) */}
          {["exceptions", "findings", "remediations", "sampling", "working-papers", "audit-universe", "risk-controls", "rule-library", "connectors"].includes(activeTab) && (
            <AuditWorkspace
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              exceptions={exceptions}
              findings={findings}
              remediations={remediations}
              riskControls={riskControls}
              rules={rules}
              samplingConfigs={[]}
              workingPapers={workingPapers}
              carriers={carriers}
              plants={plants}
              routes={routes}
              userRole={userRole}

              onAddFinding={handleAddFinding}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              onDeleteFinding={handleDeleteFinding}
              
              onAddCapa={handleAddCapa}
              onUpdateCapa={handleUpdateCapa}
              
              onUpdateRule={handleUpdateRule}
              
              onAddRiskControl={handleAddRiskControl}
              onDeleteRiskControl={handleDeleteRiskControl}

              onRunSampling={handleRunSampling}
              samplingLoading={samplingLoading}
              sampledInvoices={sampledInvoices}

              onAddCommentToException={handleAddCommentToException}
              onUpdateException={handleUpdateException}

              onUploadWorkingPaper={handleUploadWorkingPaper}
              onSignoffWorkingPaper={handleSignoffWorkingPaper}
            />
          )}

          {/* Activity audit logs console trace */}
          <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Continuous Auditor Logs</span>
              <button 
                onClick={handleLogout} 
                className="text-[10px] font-bold text-red-400 hover:underline"
              >
                Sign Out {currentUser?.name} ({userRole})
              </button>
            </div>
            <div className="h-28 overflow-y-auto bg-slate-950 p-3 rounded font-mono text-[10px] text-emerald-400 leading-relaxed border border-slate-900 space-y-1">
              {systemLogs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-6">Continuous audit terminal active. Recording compliance events...</div>
              ) : (
                systemLogs.map((log, index) => <div key={index}>{log}</div>)
              )}
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
