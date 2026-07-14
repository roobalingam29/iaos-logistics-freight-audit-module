import React, { useState } from "react";
import { 
  Building2, 
  ShieldCheck, 
  Settings, 
  Database, 
  Layers, 
  ShieldAlert, 
  FileSpreadsheet, 
  FileCheck2, 
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Upload,
  User,
  Calendar,
  AlertTriangle,
  Info
} from "lucide-react";
import { 
  Exception, 
  Finding, 
  Remediation, 
  RiskControl, 
  Rule, 
  SamplingConfig, 
  WorkingPaper, 
  Carrier, 
  Plant, 
  Route 
} from "../types";

interface AuditWorkspaceProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exceptions: Exception[];
  findings: Finding[];
  remediations: Remediation[];
  riskControls: RiskControl[];
  rules: Rule[];
  samplingConfigs: SamplingConfig[];
  workingPapers: WorkingPaper[];
  carriers: Carrier[];
  plants: Plant[];
  routes: Route[];
  userRole: string;

  // Callback triggers
  onAddFinding: (fnd: Omit<Finding, "id" | "createdAt" | "status" | "authorName">) => void;
  onUpdateFindingStatus: (id: string, status: "Open" | "Under_Review" | "Resolved" | "Closed") => void;
  onDeleteFinding: (id: string) => void;
  
  onAddCapa: (capa: Omit<Remediation, "id" | "createdAt" | "progress" | "status" | "findingTitle" | "retestingStatus" | "evidence">) => void;
  onUpdateCapa: (id: string, progress: number, retestingStatus: "Pending" | "Pass" | "Fail", status: "Active" | "Completed") => void;
  
  onUpdateRule: (id: string, enabled: boolean, threshold: number, severity: "High" | "Medium" | "Low") => void;
  
  onAddRiskControl: (rc: Omit<RiskControl, "id">) => void;
  onDeleteRiskControl: (id: string) => void;

  onRunSampling: (method: string, sampleSize: number, materialityLimit: number) => void;
  samplingLoading: boolean;
  sampledInvoices: any[];

  onAddCommentToException: (id: string, text: string) => void;
  onUpdateException: (id: string, status: string, assignedToId: string | null) => void;

  onUploadWorkingPaper: (name: string, type: "PDF" | "XLSX" | "DOCX") => void;
  onSignoffWorkingPaper: (id: string, signoff: boolean, tickmarks: string[]) => void;
}

export default function AuditWorkspace({
  activeTab,
  setActiveTab,
  exceptions,
  findings,
  remediations,
  riskControls,
  rules,
  samplingConfigs,
  workingPapers,
  carriers,
  plants,
  routes,
  userRole,

  onAddFinding,
  onUpdateFindingStatus,
  onDeleteFinding,
  onAddCapa,
  onUpdateCapa,
  onUpdateRule,
  onAddRiskControl,
  onDeleteRiskControl,
  onRunSampling,
  samplingLoading,
  sampledInvoices,
  onAddCommentToException,
  onUpdateException,
  onUploadWorkingPaper,
  onSignoffWorkingPaper
}: AuditWorkspaceProps) {
  // Local form states
  const [showAddFindingForm, setShowAddFindingForm] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingObs, setFindingObs] = useState("");
  const [findingCause, setFindingCause] = useState("");
  const [findingImpact, setFindingImpact] = useState("");
  const [findingRec, setFindingRec] = useState("");
  const [findingRating, setFindingRating] = useState<"High" | "Medium" | "Low">("Medium");
  const [findingOwner, setFindingOwner] = useState("");

  const [showAddCapaForm, setShowAddCapaForm] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState("");
  const [capaActionText, setCapaActionText] = useState("");
  const [capaOwner, setCapaOwner] = useState("");
  const [capaDueDate, setCapaDueDate] = useState("");

  const [showAddRcForm, setShowAddRcForm] = useState(false);
  const [rcCode, setRcCode] = useState("");
  const [rcName, setRcName] = useState("");
  const [rcControl, setRcControl] = useState("");
  const [rcAssertion, setRcAssertion] = useState("Accuracy");
  const [rcOwner, setRcOwner] = useState("");
  const [rcFrequency, setRcFrequency] = useState("Monthly");
  const [rcProcedure, setRcProcedure] = useState("");

  // Exception drawer/detail modal state
  const [selectedExceptionForDetail, setSelectedExceptionForDetail] = useState<Exception | null>(null);
  const [newExcCommentText, setNewExcCommentText] = useState("");

  // Sampling configs simulator state
  const [samplingMethod, setSamplingMethod] = useState<"Random" | "MonetaryUnit" | "RiskBased">("Random");
  const [samplingSize, setSamplingSize] = useState(25);
  const [samplingMateriality, setSamplingMateriality] = useState(5000);

  // File Upload Drag and drop simulated state (Module 20 & 23)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // ERP Integrator state (Module 20)
  const [connectorLog, setConnectorLog] = useState<string[]>([]);
  const [connectingErp, setConnectingErp] = useState(false);

  const isViewer = userRole === "Viewer";

  // Simulate ERP Connector Hookup (Module 20)
  const triggerErpSync = (erp: string) => {
    setConnectingErp(true);
    setConnectorLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Establishing secure handshake tunnel to ${erp} ECC Suite...`]);
    
    setTimeout(() => {
      setConnectorLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshake successful. TLS 1.3 protocol verified.`]);
    }, 1000);

    setTimeout(() => {
      setConnectorLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Mapping DB schemas: matching CarrierVendorTable to CMS_Active_Contracts...`]);
    }, 2200);

    setTimeout(() => {
      setConnectorLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Complete. Extracted 110 freight billing invoice line-items for auditing.`]);
      setConnectingErp(false);
    }, 3500);
  };

  // Simulate Drag-and-drop file upload (Module 23)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file.name);
    }
  };

  const handleFileSelected = (fileName: string) => {
    setUploadFileName(fileName);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const ext = fileName.split('.').pop()?.toUpperCase();
          const docType = ext === "PDF" ? "PDF" : ext === "XLSX" ? "XLSX" : "DOCX";
          onUploadWorkingPaper(fileName, docType);
          setTimeout(() => {
            setUploadFileName("");
            setUploadProgress(0);
          }, 1500);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      
      {/* Workspace Menu navigation sidebar */}
      <div className="xl:col-span-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-2">Workspace Sections</span>
        
        <button
          onClick={() => setActiveTab("exceptions")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "exceptions" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>22. Exception Queue</span>
          </div>
          {exceptions.filter(e => e.status === "Open").length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {exceptions.filter(e => e.status === "Open").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("findings")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "findings" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-slate-400" />
            <span>24. Observation Findings</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("remediations")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "remediations" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span>25. Remediation CAPA</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("sampling")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "sampling" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>21. Statistical Sampling</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("working-papers")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "working-papers" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>23. Working Papers</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("audit-universe")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "audit-universe" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>17. Scope & Universe</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("risk-controls")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "risk-controls" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>18. Risk & Controls Matrix</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("rule-library")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "rule-library" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>19. Analytical Rules</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("connectors")}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === "connectors" ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <span>20. ERP Connectors</span>
          </div>
        </button>
      </div>

      {/* Main Tab Working Panel */}
      <div className="xl:col-span-3 space-y-6">

        {/* 22. EXCEPTION QUEUE & WORKFLOW */}
        {activeTab === "exceptions" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">22. Exception Queue Workflow</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Continuous analytical validation exception queue. Highlights billing errors, duplicate invoicing risk, and SLA delivery delays.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Unresolved Anomalies Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Exception ID</th>
                      <th className="py-2.5 px-4">Rule Violator</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Assignee</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {exceptions.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block text-slate-800 text-[11px]">{e.description.substring(0, 50)}...</span>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase font-mono mt-0.5">Violator: {e.ruleId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            e.severity === "High" ? "bg-red-100 text-red-800" :
                            e.severity === "Medium" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {e.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${e.priority === "Urgent" ? "text-red-600 font-extrabold" : "text-slate-600"}`}>
                            {e.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{e.assignedToName || "Unassigned"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            e.status === "Open" ? "bg-red-50 text-red-600 border border-red-200" :
                            e.status === "Investigating" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                            "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedExceptionForDetail(e)}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 24. OBSERVATION FINDINGS */}
        {activeTab === "findings" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">24. Audit Observation Findings Registry</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Formalized systemic leakages and findings verified by lead auditors requiring business owners remediation.</p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => setShowAddFindingForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Issue Finding
                </button>
              )}
            </div>

            {/* Findings list */}
            <div className="space-y-4">
              {findings.map(f => (
                <div key={f.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Finding Reference: {f.id}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{f.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        f.riskRating === "High" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {f.riskRating} Risk
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono">
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Audit Observation</span>
                      <p className="text-slate-600 mt-1 leading-normal font-medium">{f.observation}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Determined Root Cause</span>
                      <p className="text-slate-600 mt-1 leading-normal font-medium">{f.rootCause}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center text-xs font-semibold pt-2 border-t border-slate-100">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Monetary Impact Risk</span>
                        <span className="text-red-600 font-extrabold font-mono text-sm">${f.impact.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Business Action Owner</span>
                        <span className="text-slate-800 font-bold block">{f.owner}</span>
                      </div>
                    </div>
                    
                    {!isViewer && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateFindingStatus(f.id, "Resolved")}
                          className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => onDeleteFinding(f.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Purge observation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 25. REMEDIATION CAPA */}
        {activeTab === "remediations" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">25. Corrective and Preventive Action (CAPA) Remediation</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Tracks corrective action milestones, ownership, due dates, retesting compliance logs, and closure signatures.</p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => setShowAddCapaForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Establish CAPA
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {remediations.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">CAPA Objective #{r.id}</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">{r.findingTitle}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      r.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Corrective Plan Action</span>
                    <p className="text-xs text-slate-600 font-medium leading-normal">{r.capaAction}</p>
                  </div>

                  {/* Progress slider bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Milestone Progress Completion</span>
                      <span className="font-mono text-slate-900">{r.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full relative">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${r.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">CAPA Lead Owner</span>
                      <span className="text-slate-800">{r.owner}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Target Close Date</span>
                      <span className="text-slate-800 font-mono">{r.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-semibold pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Retesting Compliance</span>
                      {r.retestingStatus === "Pass" ? (
                        <span className="text-emerald-600 font-bold">✓ RETESTING PASSED</span>
                      ) : r.retestingStatus === "Fail" ? (
                        <span className="text-red-600 font-bold">✗ RETESTING FAILED</span>
                      ) : (
                        <span className="text-slate-500 font-bold">Awaiting Retesting</span>
                      )}
                    </div>

                    {!isViewer && r.status !== "Completed" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onUpdateCapa(r.id, 100, "Pass", "Completed")}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-semibold rounded hover:bg-emerald-500"
                        >
                          Sign-Off Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 21. SAMPLING BUILDER */}
        {activeTab === "sampling" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">21. Statistical Sampling Builder</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Selects audit samples using industry-grade methodologies. Pick random, Monetary Unit Sampling (MUS), or Risk-Based criteria parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border border-slate-200 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Methodology</label>
                  <select
                    value={samplingMethod}
                    onChange={(e) => setSamplingMethod(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-700 w-full focus:outline-none focus:border-blue-500"
                  >
                    <option value="Random">Simple Random Sampling</option>
                    <option value="MonetaryUnit">Monetary Unit Sampling (MUS)</option>
                    <option value="RiskBased">Risk-Based Sampling</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Sample Size</label>
                  <input
                    type="number"
                    value={samplingSize}
                    onChange={(e) => setSamplingSize(parseInt(e.target.value))}
                    className="bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-700 w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Materiality Limit ($)</label>
                  <input
                    type="number"
                    value={samplingMateriality}
                    onChange={(e) => setSamplingMateriality(parseInt(e.target.value))}
                    className="bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-700 w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <button
                    onClick={() => onRunSampling(samplingMethod, samplingSize, samplingMateriality)}
                    disabled={samplingLoading}
                    className="w-full py-2 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500 transition-colors"
                  >
                    {samplingLoading ? "Computing..." : "Run Selection"}
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Sample list table */}
            {sampledInvoices.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Computed Sample Outcomes</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                    Selected Size: {sampledInvoices.length} Invoices
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                        <th className="py-2.5 px-4">Invoice ID</th>
                        <th className="py-2.5 px-4">Carrier</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4 font-mono">Total Billed</th>
                        <th className="py-2.5 px-4">LR Code</th>
                        <th className="py-2.5 px-4">Anomalies Detected?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                      {sampledInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                          <td className="py-2.5 px-4 text-slate-500">{inv.plantName}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">${inv.totalBilledAmount}</td>
                          <td className="py-2.5 px-4 font-mono">{inv.lrNumber}</td>
                          <td className="py-2.5 px-4">
                            {inv.rateToleranceExceeded || inv.weightToleranceExceeded ? (
                              <span className="text-red-600 font-bold block flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> High Risk Variant
                              </span>
                            ) : (
                              <span className="text-slate-400 block font-normal">Passed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 23. WORKING PAPERS */}
        {activeTab === "working-papers" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">23. Working Papers & Document Evidence</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Logs digital audit evidence, and supporting spreadsheets. Features reviewers' signoffs and customizable Auditor Tick Marks.</p>
              </div>

              {/* Drag and drop support */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center space-y-2 transition-all ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Upload className="w-10 h-10 text-slate-400" />
                <div className="text-xs">
                  <span className="font-bold text-blue-600 hover:underline cursor-pointer">Upload Working Paper Evidence</span>
                  <span className="text-slate-500"> or drag and drop your PDF / Excel sheets</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Supports PDF, XLSX, DOCX up to 25MB</span>
                <input
                  type="file"
                  id="wp-file-picker"
                  className="hidden"
                  accept=".pdf,.xlsx,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0].name);
                    }
                  }}
                />
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-1 bg-slate-50 p-3 rounded border">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Uploading: {uploadFileName}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* List working papers */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vouched Evidence Working Sheets</span>
              </div>
              <div className="divide-y divide-slate-100">
                {workingPapers.map(wp => (
                  <div key={wp.id} className="p-5 hover:bg-slate-50/40 flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800">{wp.fileName}</h4>
                      <div className="flex gap-3 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        <span>Format: {wp.fileType}</span>
                        <span>Size: {wp.fileSize}</span>
                        <span>Uploaded: {wp.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Interactive tickmarks visual toggle */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Audit Tickmarks</span>
                        <div className="flex gap-1.5">
                          {["V", "C", "M", "R"].map(mark => {
                            const isApplied = wp.tickMarks.includes(mark);
                            const markLabel = mark === "V" ? "Vouched (Invoice Verified)" :
                                              mark === "C" ? "Calculated (Formula Recomputed)" :
                                              mark === "M" ? "Matched (LR matched to POD)" : "Reconciled (Ledger matching)";
                            return (
                              <button
                                key={mark}
                                onClick={() => {
                                  if (isViewer) return;
                                  const newMarks = isApplied 
                                    ? wp.tickMarks.filter(m => m !== mark) 
                                    : [...wp.tickMarks, mark];
                                  onSignoffWorkingPaper(wp.id, wp.reviewerSignoff, newMarks);
                                }}
                                disabled={isViewer}
                                className={`w-6 h-6 border rounded flex items-center justify-center font-mono font-bold text-[10px] ${
                                  isApplied ? "bg-blue-600 border-blue-700 text-white font-black" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                }`}
                                title={markLabel}
                              >
                                {mark}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review signoff toggle */}
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Review Signoff</span>
                        {wp.reviewerSignoff ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Signed: {wp.reviewerName}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (isViewer) return;
                              onSignoffWorkingPaper(wp.id, true, wp.tickMarks);
                            }}
                            disabled={isViewer}
                            className="px-2.5 py-1 border border-blue-600 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-50"
                          >
                            Signoff
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 17. SCOPE & AUDIT UNIVERSE */}
        {activeTab === "audit-universe" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">17. Scope & Audit Universe Manager</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Defines business plants, active carriers, and corridor route boundaries under continuous electronic auditing scope.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plant List Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Business Plants Scope ({plants.length})</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {plants.map(p => (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-xs text-slate-800">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono font-semibold uppercase">{p.code} • {p.city}, {p.country}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 px-2 py-0.5 rounded">Active Scope</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrier List Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Carrier Logistics Partner Scope ({carriers.length})</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {carriers.map(c => (
                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-xs text-slate-800">{c.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono font-semibold uppercase">{c.code}</span>
                      </div>
                      <span className="bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 px-2 py-0.5 rounded">Vetted SLA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 18. RISK & CONTROL MATRIX */}
        {activeTab === "risk-controls" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">18. Risk & Control Matrix (RCM)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Defines risk objectives, standard controls, financial assertions, frequencies, and mandatory audit testing procedures.</p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => setShowAddRcForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riskControls.map(rc => (
                <div key={rc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">RCM Code: {rc.riskCode}</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">{rc.riskName}</h4>
                    </div>
                    {!isViewer && (
                      <button
                        onClick={() => onDeleteRiskControl(rc.id)}
                        className="text-red-500 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 font-semibold text-xs text-slate-700">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Assigned Control Standard</span>
                      <span className="text-slate-800 font-bold block mt-0.5">{rc.controlName}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Testing Procedure Checklist</span>
                      <p className="text-slate-600 font-medium leading-normal mt-0.5">{rc.testProcedure}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-slate-400 pt-2 border-t border-slate-100">
                    <div>
                      <span>Assertion</span>
                      <span className="text-blue-700 font-extrabold block text-xs font-sans mt-0.5">{rc.assertion}</span>
                    </div>
                    <div>
                      <span>Frequency</span>
                      <span className="text-slate-700 block text-xs font-sans mt-0.5">{rc.frequency}</span>
                    </div>
                    <div>
                      <span>Owner</span>
                      <span className="text-slate-700 block text-xs font-sans mt-0.5 truncate">{rc.owner}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 19. RULE LIBRARY */}
        {activeTab === "rule-library" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">19. Continuous Auditing Rules Library</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Enables, disables, or reconfigures SQL / CAAT logic parameters running on logistics billing databases.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map(rule => (
                <div key={rule.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">{rule.category} Rules</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">{rule.name}</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.isEnabled}
                          onChange={(e) => {
                            if (isViewer) return;
                            onUpdateRule(rule.id, e.target.checked, rule.threshold, rule.severity);
                          }}
                          disabled={isViewer}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded border border-slate-800 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {rule.sqlRule}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
                    <div>
                      <span>TOLERANCE THRESHOLD</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          step="0.1"
                          value={rule.threshold}
                          onChange={(e) => {
                            if (isViewer) return;
                            onUpdateRule(rule.id, rule.isEnabled, parseFloat(e.target.value), rule.severity);
                          }}
                          disabled={isViewer}
                          className="bg-slate-50 border rounded p-1 text-xs text-slate-800 w-16 text-center font-bold font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <span>ALERTER SEVERITY</span>
                      <select
                        value={rule.severity}
                        onChange={(e) => {
                          if (isViewer) return;
                          onUpdateRule(rule.id, rule.isEnabled, rule.threshold, e.target.value as any);
                        }}
                        disabled={isViewer}
                        className="bg-slate-50 border rounded p-1 text-xs text-slate-800 w-full font-bold mt-1"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 20. DATA SOURCE & CONNECTOR */}
        {activeTab === "connectors" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">20. ERP & API Data Connectors</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Configure live database connections to SAP, Oracle Netsuite, or upload manual CSV/Excel spreadsheets to seed the audit workbench.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SAP card */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">SAP ECC Connector</span>
                    <h4 className="font-bold text-slate-800 text-xs">Direct SAP RFC Table Connector</h4>
                    <span className="text-slate-400 block text-[11px] leading-normal font-medium">Map freight invoices, carrier billing files, and plant indents from SAP ECC / S4HANA.</span>
                  </div>
                  <button
                    onClick={() => triggerErpSync("SAP S/4HANA")}
                    disabled={connectingErp}
                    className="w-full py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500 transition-colors"
                  >
                    Sync SAP Tables
                  </button>
                </div>

                {/* Oracle card */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Oracle Netsuite</span>
                    <h4 className="font-bold text-slate-800 text-xs">Oracle SQL Database Integration</h4>
                    <span className="text-slate-400 block text-[11px] leading-normal font-medium">Connects directly to Oracle Cloud tables. Extracts freight accruals and actuals automatically.</span>
                  </div>
                  <button
                    onClick={() => triggerErpSync("Oracle Cloud")}
                    disabled={connectingErp}
                    className="w-full py-1.5 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500 transition-colors"
                  >
                    Sync Oracle
                  </button>
                </div>

                {/* Custom API */}
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">WMS API Integration</span>
                    <h4 className="font-bold text-slate-800 text-xs">REST API Webhook Sync</h4>
                    <span className="text-slate-400 block text-[11px] leading-normal font-medium">Real-time ingestion of physical scale weights and gate timesheets from WMS portals.</span>
                  </div>
                  <button
                    className="w-full py-1.5 border border-slate-300 text-slate-700 rounded font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Configure Webhooks
                  </button>
                </div>
              </div>
            </div>

            {connectorLog.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-[10px] text-emerald-400 leading-relaxed space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-2">CONNECTOR EXECUTION LOGS</span>
                {connectorLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {connectingErp && (
                  <div className="animate-pulse text-blue-400">▶ Syncing remote datasets...</div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================
          POP-UP DIALOGS & OVERLAY SCREENS 
          ======================================================== */}

      {/* DETAILED EXCEPTION WORKFLOW PORTAL DRAWER */}
      {selectedExceptionForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-brand-navy text-white flex justify-between items-center shrink-0">
              <span className="font-bold text-sm uppercase tracking-wider">Exception Audit Workspace: {selectedExceptionForDetail.id}</span>
              <button
                onClick={() => setSelectedExceptionForDetail(null)}
                className="text-slate-400 hover:text-white font-extrabold focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="p-4 bg-red-50 text-red-800 rounded border border-red-100 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 uppercase text-[10px]">Anomalous Event Violation Description</h4>
                  <p className="mt-1 leading-relaxed text-slate-700 font-medium">{selectedExceptionForDetail.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-500 border-b border-slate-100 pb-3">
                <div>
                  <span>Assigned Investigator</span>
                  <span className="text-slate-900 font-bold block mt-1">{selectedExceptionForDetail.assignedToName || "Unassigned"}</span>
                </div>
                <div>
                  <span>Severity Alerter Level</span>
                  <span className="text-red-600 font-bold block mt-1">{selectedExceptionForDetail.severity} Severity</span>
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3">
                <span className="font-bold text-slate-700 uppercase block tracking-wider">Audit Investigation Trails & Logs</span>
                
                <div className="space-y-2 max-h-44 overflow-y-auto bg-slate-50 p-3 rounded border">
                  {selectedExceptionForDetail.comments.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 font-semibold italic">No comments filed. Begin investigation record below.</p>
                  ) : (
                    selectedExceptionForDetail.comments.map(c => (
                      <div key={c.id} className="p-2.5 bg-white border rounded shadow-sm space-y-1">
                        <div className="flex justify-between font-bold text-[10px] text-slate-500">
                          <span className="text-blue-700">{c.authorName}</span>
                          <span className="font-mono">{c.createdAt.substring(11, 16)}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {!isViewer && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type audit record comments or dispute grounds..."
                      value={newExcCommentText}
                      onChange={(e) => setNewExcCommentText(e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (!newExcCommentText) return;
                        onAddCommentToException(selectedExceptionForDetail.id, newExcCommentText);
                        // update locally too
                        selectedExceptionForDetail.comments.push({
                          id: `local-${Math.random()}`,
                          exceptionId: selectedExceptionForDetail.id,
                          authorName: "Sarah Jenkins",
                          text: newExcCommentText,
                          createdAt: new Date().toISOString()
                        });
                        setNewExcCommentText("");
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                    >
                      Record Comment
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedExceptionForDetail(null)}
                className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              {!isViewer && (
                <button
                  onClick={() => {
                    onUpdateException(selectedExceptionForDetail.id, "Resolved", null);
                    selectedExceptionForDetail.status = "Resolved";
                    setSelectedExceptionForDetail(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-500"
                >
                  Resolve Exception
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW OBSERVATION FINDING FORM */}
      {showAddFindingForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-brand-navy text-white flex justify-between items-center">
              <span className="font-bold text-sm uppercase tracking-wider">Issue Formal Audit Finding</span>
              <button
                onClick={() => setShowAddFindingForm(false)}
                className="text-slate-400 hover:text-white font-extrabold focus:outline-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Finding Title</label>
                <input
                  type="text"
                  placeholder="Systemic Rate Contract Variance..."
                  value={findingTitle}
                  onChange={(e) => setFindingTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Audit Observation (Describe leakage gap)</label>
                <textarea
                  rows={2}
                  placeholder="Carrier DHL Munich rates regularly exceed active base values..."
                  value={findingObs}
                  onChange={(e) => setFindingObs(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Financial Leakage Impact ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={findingImpact}
                    onChange={(e) => setFindingImpact(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Risk Rating</label>
                  <select
                    value={findingRating}
                    onChange={(e) => setFindingRating(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Determined Root Cause</label>
                <input
                  type="text"
                  placeholder="Synchronization lag delays of contracts tables in SAP ECC..."
                  value={findingCause}
                  onChange={(e) => setFindingCause(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">System Recommendation</label>
                <textarea
                  rows={2}
                  placeholder="Establish real-time API contract connectors..."
                  value={findingRec}
                  onChange={(e) => setFindingRec(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Operational Business Action Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Timothy Vance (Global AP Lead)"
                  value={findingOwner}
                  onChange={(e) => setFindingOwner(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddFindingForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!findingTitle) return;
                    onAddFinding({
                      title: findingTitle,
                      observation: findingObs,
                      rootCause: findingCause,
                      impact: parseFloat(findingImpact) || 0,
                      recommendation: findingRec,
                      riskRating: findingRating,
                      owner: findingOwner
                    });
                    setShowAddFindingForm(false);
                    setFindingTitle("");
                    setFindingObs("");
                    setFindingCause("");
                    setFindingImpact("");
                    setFindingRec("");
                    setFindingOwner("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                >
                  Confirm Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW REMEDIATION CAPA DIALOG */}
      {showAddCapaForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-brand-navy text-white flex justify-between items-center">
              <span className="font-bold text-sm uppercase tracking-wider">Establish CAPA Remediation Action</span>
              <button
                onClick={() => setShowAddCapaForm(false)}
                className="text-slate-400 hover:text-white font-extrabold focus:outline-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Link to formal Finding</label>
                <select
                  value={selectedFindingId}
                  onChange={(e) => setSelectedFindingId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-semibold"
                >
                  <option value="">Select linked objective</option>
                  {findings.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Corrective Plan Action Milestone</label>
                <textarea
                  rows={3}
                  placeholder="Formulate precise CAPA measures, system rules, or vendor guidelines upgrades..."
                  value={capaActionText}
                  onChange={(e) => setCapaActionText(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">CAPA Owner</label>
                  <input
                    type="text"
                    placeholder="Helena Vance"
                    value={capaOwner}
                    onChange={(e) => setCapaOwner(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Target Closure Due Date</label>
                  <input
                    type="date"
                    value={capaDueDate}
                    onChange={(e) => setCapaDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddCapaForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedFindingId || !capaActionText) return;
                    onAddCapa({
                      findingId: selectedFindingId,
                      capaAction: capaActionText,
                      owner: capaOwner,
                      dueDate: capaDueDate
                    });
                    setShowAddCapaForm(false);
                    setCapaActionText("");
                    setCapaOwner("");
                    setCapaDueDate("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                >
                  Submit Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW RISK MATRIX DIALOG */}
      {showAddRcForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-brand-navy text-white flex justify-between items-center">
              <span className="font-bold text-sm uppercase tracking-wider">Add Risk Control Matrix Item</span>
              <button
                onClick={() => setShowAddRcForm(false)}
                className="text-slate-400 hover:text-white font-extrabold focus:outline-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Risk Code</label>
                  <input
                    type="text"
                    placeholder="e.g. R9-VOL-VANCE"
                    value={rcCode}
                    onChange={(e) => setRcCode(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Financial Assertion</label>
                  <input
                    type="text"
                    placeholder="Accuracy & Accuracy"
                    value={rcAssertion}
                    onChange={(e) => setRcAssertion(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Risk Name Description</label>
                <input
                  type="text"
                  placeholder="Billing based on inflated volumetric parameters..."
                  value={rcName}
                  onChange={(e) => setRcName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Control Objective Name</label>
                <input
                  type="text"
                  placeholder="Volumetric Dimensional scale verification..."
                  value={rcControl}
                  onChange={(e) => setRcControl(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Testing Procedures Checklist</label>
                <textarea
                  rows={2}
                  placeholder="Reconcile all dimension billings with actual physically scaled warehouse logs..."
                  value={rcProcedure}
                  onChange={(e) => setRcProcedure(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Risk Frequency</label>
                  <input
                    type="text"
                    placeholder="Daily / Transactional"
                    value={rcFrequency}
                    onChange={(e) => setRcFrequency(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Risk Owner</label>
                  <input
                    type="text"
                    placeholder="Finance Auditor"
                    value={rcOwner}
                    onChange={(e) => setRcOwner(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddRcForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rcCode || !rcName) return;
                    onAddRiskControl({
                      riskCode: rcCode,
                      riskName: rcName,
                      controlName: rcControl,
                      assertion: rcAssertion,
                      owner: rcOwner,
                      frequency: rcFrequency,
                      testProcedure: rcProcedure
                    });
                    setShowAddRcForm(false);
                    setRcCode("");
                    setRcName("");
                    setRcControl("");
                    setRcProcedure("");
                    setRcOwner("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                >
                  Confirm Risk Control
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
