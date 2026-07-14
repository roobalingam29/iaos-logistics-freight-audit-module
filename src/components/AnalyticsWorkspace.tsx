import React, { useState, useMemo } from "react";
import { 
  Coins, 
  Calculator, 
  Map, 
  Clock, 
  BarChart3, 
  Copy, 
  Compass, 
  Flame, 
  Truck, 
  FileCheck2, 
  BookOpen, 
  AlertTriangle, 
  ThumbsUp, 
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Filter,
  CheckCircle2
} from "lucide-react";
import { FreightInvoice, Carrier, Plant, Route } from "../types";

interface AnalyticsWorkspaceProps {
  invoices: FreightInvoice[];
  carriers: Carrier[];
  plants: Plant[];
  routes: Route[];
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  onUpdateInvoiceStatus: (id: string, status: "Approved" | "Disputed", remarks: string) => void;
}

export default function AnalyticsWorkspace({
  invoices,
  carriers,
  plants,
  routes,
  activeSubTab,
  setActiveSubTab,
  onUpdateInvoiceStatus
}: AnalyticsWorkspaceProps) {
  // Global analytical filters
  const [filterCarrier, setFilterCarrier] = useState("All");
  const [filterPlant, setFilterPlant] = useState("All");
  const [filterRoute, setFilterRoute] = useState("All");
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);

  // Modal cost simulator state (Module 7)
  const [simWeight, setSimWeight] = useState(12000); // 12 tons
  const [simDistance, setSimDistance] = useState(850); // 850 km

  // Audit comments state
  const [auditComment, setAuditComment] = useState("");
  const [selectedInvoiceForAudit, setSelectedInvoiceForAudit] = useState<string | null>(null);

  const subTabs = [
    { id: "rates", label: "1. Rate Compliance", icon: Coins, category: "Rates & Contracts" },
    { id: "weights", label: "2. Weight / Volume", icon: Calculator, category: "Rates & Contracts" },
    { id: "routes", label: "3. Route & GIS Distance", icon: Map, category: "Routes & SLA" },
    { id: "detention", label: "4. Detention & Demurrage", icon: Clock, category: "Accessorials" },
    { id: "carrier-performance", label: "5. Carrier SLA Scorecard", icon: BarChart3, category: "Carriers" },
    { id: "duplicates", label: "6. Duplicate Billing", icon: Copy, category: "Finance Rules" },
    { id: "modal-cost", label: "7. Multi-Modal Optimizer", icon: Compass, category: "Routes & SLA" },
    { id: "fuel", label: "8. Fuel Surcharges", icon: Flame, category: "Accessorials" },
    { id: "empty-return", label: "9. Backhaul Utilization", icon: Truck, category: "Routes & SLA" },
    { id: "lr-pod", label: "10. LR / POD Match", icon: FileCheck2, category: "Finance Rules" },
    { id: "provisions", label: "11. Provisions Accuracy", icon: BookOpen, category: "Finance Rules" },
    { id: "sla-transit", label: "12. Transit SLA Track", icon: Clock, category: "Routes & SLA" },
    { id: "claims", label: "13. Cargo Damage Claims", icon: AlertTriangle, category: "Carriers" },
    { id: "placements", label: "14. Vehicle Placements", icon: Truck, category: "Carriers" },
    { id: "cost-trends", label: "15. Cost per Unit Trends", icon: TrendingUp, category: "Finance Rules" }
  ];

  // Filter invoices based on active tab and global filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterCarrier !== "All" && inv.carrierId !== filterCarrier && inv.carrierName !== filterCarrier) return false;
      if (filterPlant !== "All" && inv.plantId !== filterPlant && inv.plantName !== filterPlant) return false;
      if (filterRoute !== "All" && inv.routeId !== filterRoute && `${inv.routeOrigin} ➔ ${inv.routeDestination}` !== filterRoute) return false;
      
      // Module specific discrepancy views
      if (discrepancyOnly) {
        if (activeSubTab === "rates" && !inv.rateToleranceExceeded) return false;
        if (activeSubTab === "weights" && !inv.weightToleranceExceeded) return false;
        if (activeSubTab === "routes" && inv.routeInflationPct <= 5) return false;
        if (activeSubTab === "detention" && inv.detentionCharges <= 0) return false;
        if (activeSubTab === "duplicates" && !inv.isDuplicate) return false;
        if (activeSubTab === "fuel" && inv.fuelVariance <= 10) return false;
        if (activeSubTab === "lr-pod" && inv.podStatus === "Matched") return false;
        if (activeSubTab === "sla-transit" && !inv.isLate) return false;
        if (activeSubTab === "claims" && !inv.hasDamageClaim) return false;
        if (activeSubTab === "placements" && inv.placedQuantity === inv.indentQuantity) return false;
      }
      return true;
    });
  }, [invoices, activeSubTab, filterCarrier, filterPlant, filterRoute, discrepancyOnly]);

  // Aggregate metrics dynamically based on current selections
  const derivedMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalContract = 0;
    let rateVarianceSum = 0;
    let totalRecoverable = 0;
    let weightVarianceSum = 0;
    let inflatedDistanceInvs = 0;
    let totalDetentionBilled = 0;
    let totalFuelBilled = 0;
    let totalFuelCalculated = 0;
    let duplicateRiskSum = 0;
    let accrualSum = 0;
    let placementSlaSum = 0;
    let totalClaimsSubmitted = 0;
    let totalClaimsRecovered = 0;

    filteredInvs().forEach(inv => {
      totalBilled += inv.totalBilledAmount;
      totalContract += inv.contractRate;
      rateVarianceSum += inv.rateVariance;
      totalRecoverable += (inv.rateRecoverableAmt + inv.detentionRecoverable + inv.lostOpportunityAmt);
      weightVarianceSum += inv.weightVariance;
      if (inv.routeInflationPct > 10) inflatedDistanceInvs += 1;
      totalDetentionBilled += inv.detentionCharges;
      totalFuelBilled += inv.billedFuelSurcharge;
      totalFuelCalculated += inv.calculatedFuelSurcharge;
      if (inv.isDuplicate) duplicateRiskSum += inv.totalBilledAmount;
      accrualSum += inv.accruedAmount;
      if (inv.placedQuantity === inv.indentQuantity) placementSlaSum += 1;
      if (inv.hasDamageClaim) {
        totalClaimsSubmitted += inv.claimAmount;
        if (inv.claimStatus === "Recovered") {
          totalClaimsRecovered += inv.claimAmount;
        }
      }
    });

    return {
      totalBilled,
      totalContract,
      rateVarianceSum,
      totalRecoverable,
      weightVarianceSum,
      inflatedDistanceInvs,
      totalDetentionBilled,
      totalFuelBilled,
      totalFuelCalculated,
      duplicateRiskSum,
      accrualSum,
      placementSlaSum,
      totalClaimsSubmitted,
      totalClaimsRecovered
    };

    function filteredInvs() {
      return filteredInvoices;
    }
  }, [filteredInvoices]);

  // Simulate Multi-Modal Logistics cost analysis (Module 7)
  const modalCosts = useMemo(() => {
    const wtTons = simWeight / 1000;
    const dist = simDistance;
    
    const modes = [
      { mode: "Road Freight", ratePerTonKm: 0.15, leadTimeDays: Math.ceil(dist / 600), emissionsCo2Kg: wtTons * dist * 0.08, indexColor: "bg-blue-500" },
      { mode: "Rail Transport", ratePerTonKm: 0.06, leadTimeDays: Math.ceil(dist / 400) + 1, emissionsCo2Kg: wtTons * dist * 0.02, indexColor: "bg-emerald-500" },
      { mode: "Sea Cargo (Container)", ratePerTonKm: 0.03, leadTimeDays: Math.ceil(dist / 300) + 4, emissionsCo2Kg: wtTons * dist * 0.01, indexColor: "bg-indigo-500" },
      { mode: "Air Express", ratePerTonKm: 0.85, leadTimeDays: 1, emissionsCo2Kg: wtTons * dist * 0.65, indexColor: "bg-red-500" }
    ];

    return modes.map(m => {
      const baseCost = wtTons * dist * m.ratePerTonKm;
      const fuelSurcharge = baseCost * 0.18;
      const totalEstimated = parseFloat((baseCost + fuelSurcharge).toFixed(2));
      return {
        ...m,
        cost: totalEstimated,
        fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2))
      };
    }).sort((a, b) => a.cost - b.cost);
  }, [simWeight, simDistance]);

  const handleApplyDispute = (invId: string, status: "Approved" | "Disputed") => {
    onUpdateInvoiceStatus(invId, status, auditComment || "Manually updated during workspace analytical audit.");
    setSelectedInvoiceForAudit(null);
    setAuditComment("");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      
      {/* 15 Modules Navigation sidebar - Fiori-style panel */}
      <div className="xl:col-span-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Analytical Modules</h2>
        </div>

        {/* Grouped view list of 15 subtabs */}
        <div className="space-y-4">
          {["Rates & Contracts", "Routes & SLA", "Accessorials", "Carriers", "Finance Rules"].map(cat => (
            <div key={cat} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-1">{cat}</span>
              {subTabs.filter(t => t.category === cat).map(tab => {
                const TabIcon = tab.icon;
                const isSelected = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all duration-150 ${
                      isSelected 
                        ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-sm" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <TabIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isSelected ? "text-blue-600 stroke-2" : ""}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Analytical Workbench (3 columns) */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Dynamic Global Filters Bar */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Workspace Filters</span>
            </div>

            {/* Carrier Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Carrier</label>
              <select
                value={filterCarrier}
                onChange={(e) => setFilterCarrier(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Carriers</option>
                {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Plant Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Plant Location</label>
              <select
                value={filterPlant}
                onChange={(e) => setFilterPlant(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Plants</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Route Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Route Corridor</label>
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Route Corridors</option>
                {routes.map(r => <option key={r.id} value={`${r.origin} ➔ ${r.destination}`}>{r.origin} ➔ {r.destination}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
              <input
                type="checkbox"
                checked={discrepancyOnly}
                onChange={(e) => setDiscrepancyOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-semibold text-slate-700">Flagged Anomalies Only</span>
            </label>
          </div>
        </div>

        {/* ========================================================
            MODULE WORKBENCH SWITCHER 
            ======================================================== */}
        
        {/* MODULE 1: FREIGHT RATE CONTRACT COMPLIANCE */}
        {activeSubTab === "rates" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Freight Rate Contract Compliance Audit</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated comparison of billed line-haul rate versus contractual values. Highlights over-tolerance deviations.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50/50 p-4 rounded border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rate Variance</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">${derivedMetrics.rateVarianceSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Recoverable Rate Overcharges</span>
                  <span className="text-xl font-bold text-red-600 font-mono">${derivedMetrics.totalRecoverable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Audited Records Count</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">{filteredInvoices.length} Invoices</span>
                </div>
              </div>
            </div>

            {/* Invoices compliance grid table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Linehaul Rate Discrepancy Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Contract ID</th>
                      <th className="py-2.5 px-4 font-mono">Base Contract Rate</th>
                      <th className="py-2.5 px-4 font-mono">Billed Rate</th>
                      <th className="py-2.5 px-4 font-mono">Rate Variance</th>
                      <th className="py-2.5 px-4">Tolerance Check</th>
                      <th className="py-2.5 px-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{inv.contractNumber}</td>
                        <td className="py-2.5 px-4 font-mono">${inv.contractRate}</td>
                        <td className="py-2.5 px-4 font-mono text-red-600">${inv.billedRate}</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.rateVariance > 0 ? (
                            <span className="text-red-600 font-bold">+${inv.rateVariance}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {inv.rateToleranceExceeded ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded font-bold">EXCEEDED</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold">COMPLIANT</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedInvoiceForAudit(inv.id)}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Verify
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

        {/* MODULE 2: WEIGHT / VOLUME VARIANCE */}
        {activeSubTab === "weights" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Weight / Volume Variance Audit</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Cross-checks dimensional/charged carrier weight sheets against actual scale weight logged in physical warehouse gate scale registers.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50/50 p-4 rounded border border-amber-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Weight Variance Checked</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">{derivedMetrics.weightVarianceSum.toLocaleString()} kg</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Sum of billed vs actual weight deviations across selected routes.</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Weight Over-Tolerance Incidents</span>
                  <span className="text-xl font-bold text-red-600 font-mono">
                    {filteredInvoices.filter(inv => inv.weightToleranceExceeded).length} Invoices
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Incident rate: {((filteredInvoices.filter(inv => inv.weightToleranceExceeded).length / (filteredInvoices.length || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Carrier Weight Verification Sheets</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Warehouse scale actual</th>
                      <th className="py-2.5 px-4">Carrier charged weight</th>
                      <th className="py-2.5 px-4">Variance (kg)</th>
                      <th className="py-2.5 px-4">Volume (CBM)</th>
                      <th className="py-2.5 px-4">Variance Indicator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.actualWeightKg.toLocaleString()} kg</td>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">{inv.chargedWeightKg.toLocaleString()} kg</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.chargedWeightKg - inv.actualWeightKg > 0 ? (
                            <span className="text-red-600 font-bold">+{ (inv.chargedWeightKg - inv.actualWeightKg).toFixed(1) }</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{inv.volumeCbm} m³</td>
                        <td className="py-2.5 px-4">
                          {inv.weightToleranceExceeded ? (
                            <div className="flex items-center gap-1.5 text-red-600 font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>Overcharged Weight ({ ((inv.chargedWeightKg - inv.actualWeightKg) / inv.actualWeightKg * 100).toFixed(0) }%)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Match</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: ROUTE & DISTANCE ANALYTICS */}
        {activeSubTab === "routes" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Route & GIS Distance Analytics</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Compares optimal route distances generated by standard geo-mapping tools against actual billed distances charged by carrier logistics logs.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50/50 p-4 rounded border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Optimal GPS Distance Checked</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">10,480.2 KM</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Route Inflation Incidents</span>
                  <span className="text-xl font-bold text-red-600 font-mono">{derivedMetrics.inflatedDistanceInvs} Invoices</span>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Max Distance Inflation</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">30.0% Over</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">GIS Route Distance Discrepancy Log</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Corridor Origin / Destination</th>
                      <th className="py-2.5 px-4 font-mono">Optimal GPS Distance</th>
                      <th className="py-2.5 px-4 font-mono">Billed Distance</th>
                      <th className="py-2.5 px-4 font-mono">Inflation %</th>
                      <th className="py-2.5 px-4">GIS Recommendation Route</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold block text-slate-800">{inv.routeOrigin}</span>
                          <span className="text-[10px] text-slate-400 block">➔ {inv.routeDestination}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono">{inv.gpsDistance} KM</td>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">{inv.billedDistance} KM</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.routeInflationPct > 0 ? (
                            <span className={`font-bold ${inv.routeInflationPct > 10 ? "text-red-600" : "text-amber-600"}`}>
                              +{inv.routeInflationPct}%
                            </span>
                          ) : (
                            <span className="text-emerald-600">0%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[10px] font-mono border border-slate-200">
                            Use GPS Optimal: {inv.gpsDistance} KM via I-80 E / G15
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: DETENTION & DEMURRAGE */}
        {activeSubTab === "detention" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Detention & Demurrage accessorial Tracking</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Correlates driver wait times, port demurrage fees, and container storage charges with physical gate log entries and warehouse timesheets to verify validity.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Accessorial Billed</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">${derivedMetrics.totalDetentionBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Recoverable Overcharges</span>
                  <span className="text-xl font-bold text-red-600 font-mono">${ (filteredInvoices.filter(inv => inv.detentionCharges > 100).length * 350).toLocaleString(undefined, { minimumFractionDigits: 2 }) }</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Mean Driver Wait Time</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    { (filteredInvoices.reduce((sum, inv) => sum + inv.waitingTimeHours, 0) / (filteredInvoices.length || 1)).toFixed(1) } Hours
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Accessorial Charge Ledger & Gate Log Match</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Logistics Hub</th>
                      <th className="py-2.5 px-4 font-mono">Billed Detention</th>
                      <th className="py-2.5 px-4 font-mono">Billed Demurrage</th>
                      <th className="py-2.5 px-4 font-mono">Billed Wait Time</th>
                      <th className="py-2.5 px-4">Gate-Log Match Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{inv.plantName}</td>
                        <td className="py-2.5 px-4 font-mono text-red-600 font-bold">${inv.detentionCharges}</td>
                        <td className="py-2.5 px-4 font-mono">${inv.demurrageCharges}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.waitingTimeHours} Hours</td>
                        <td className="py-2.5 px-4">
                          {inv.waitingTimeHours > 4.0 ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">REJECTED (Wait limit exceeded)</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">APPROVED Match</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: CARRIER PERFORMANCE SCORING */}
        {activeSubTab === "carrier-performance" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Carrier Performance Scorecard & Analytics</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates dynamic ranking weights combining core metrics: On-Time Delivery rates, cargo damage occurrences, and billing audit accuracy.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {carriers.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        #{c.ranking}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">{c.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-blue-600 font-mono">{c.performanceScore}</span>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Overall Score</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">On-Time SLA %</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{c.onTimeRate}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Cargo Damage Claim Rate</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{c.damageRate}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Financial Claim Rate</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{c.claimsRate}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Late Deliveries</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{c.lateDeliveries}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: DUPLICATE FREIGHT BILLING */}
        {activeSubTab === "duplicates" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Duplicate Freight Billing Risk Detector</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated screening algorithm scanning for repeated billings with matching shipment keys, LR numbers, POD receipts, or duplicate total amounts.</p>
              </div>
              <div className="bg-red-50/50 p-4 rounded border border-red-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-red-900">Total Duplicate Billing Exposure Risks</h4>
                  <p className="text-xs text-red-700 font-mono mt-1 font-bold">${derivedMetrics.duplicateRiskSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Automatic double billing safety checks blocked these invoices from entering AP disbursement.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Duplicate Invoices & Over-Billing Flagged Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Original Billing No Reference</th>
                      <th className="py-2.5 px-4 font-mono">Billed Amount</th>
                      <th className="py-2.5 px-4">LR Number</th>
                      <th className="py-2.5 px-4">Shipment Number</th>
                      <th className="py-2.5 px-4">Risk Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4">
                          {inv.isDuplicate ? (
                            <span className="bg-red-50 text-red-800 font-mono px-2 py-0.5 rounded font-bold">
                              DUPLICATE OF {inv.duplicateOfInvoiceNo}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">${inv.totalBilledAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.lrNumber}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.shipmentNumber}</td>
                        <td className="py-2.5 px-4">
                          {inv.isDuplicate ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2.5 py-0.5 rounded font-extrabold uppercase animate-pulse">CRITICAL DOUBLE BILL</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">UNIQUE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 7: MULTI MODAL COST COMPARISON OPTIMIZER */}
        {activeSubTab === "modal-cost" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Multi Modal Cost Comparison & Optimizer</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates optimal freight paths, transport carbon footprints, and logistics costs across Road, Rail, Sea, and Air networks.</p>
              </div>

              {/* Sliders to simulate custom shipments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Simulated Shipment Cargo Weight: { (simWeight/1000).toFixed(1) } Tons</label>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="500"
                    value={simWeight}
                    onChange={(e) => setSimWeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-[10px] text-slate-400 block">Adjust cargo capacity to estimate modal cost break points.</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Simulated Routing Distance: {simDistance} KM</label>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={simDistance}
                    onChange={(e) => setSimDistance(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-[10px] text-slate-400 block">Adjust transport distance constraints.</span>
                </div>
              </div>
            </div>

            {/* Modal comparison table results */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {modalCosts.map((m, idx) => (
                <div key={m.mode} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden space-y-4">
                  {idx === 0 && (
                    <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl uppercase">Most Economical</span>
                  )}
                  {m.mode === "Rail Transport" && (
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl uppercase">Green Pick</span>
                  )}
                  
                  <div className="space-y-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Transport Mode</span>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.indexColor}`}></span>
                      {m.mode}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">${m.cost.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">Incl. 18% fuel index: ${m.fuelSurcharge}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-500 font-semibold">
                    <div className="flex justify-between">
                      <span>Transit Lead-Time:</span>
                      <span className="text-slate-800 font-bold">{m.leadTimeDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO2 Emission footprint:</span>
                      <span className="text-emerald-600 font-bold">{m.emissionsCo2Kg.toFixed(0)} kg CO₂</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 8: FUEL SURCHARGE VALIDATION */}
        {activeSubTab === "fuel" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fuel Surcharge formula Validation</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Recalculates contractual fuel charges using live indexes (Weekly EIA Gasoil values) and validates formula execution accuracies.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Fuel Audited</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">${derivedMetrics.totalFuelBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fuel Surcharge Variance Overcharging</span>
                  <span className="text-xl font-bold text-red-600 font-mono">${ (derivedMetrics.totalFuelBilled - derivedMetrics.totalFuelCalculated).toLocaleString(undefined, { minimumFractionDigits: 2 }) }</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Formula Surcharge Recalculation Log</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Index Applied (EIA)</th>
                      <th className="py-2.5 px-4 font-mono">Billed Surcharge</th>
                      <th className="py-2.5 px-4 font-mono">Formula Calculated Surcharge</th>
                      <th className="py-2.5 px-4 font-mono">Variance</th>
                      <th className="py-2.5 px-4">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">${inv.fuelIndexApplied} / gallon</td>
                        <td className="py-2.5 px-4 font-mono text-red-600 font-bold">${inv.billedFuelSurcharge}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">${inv.calculatedFuelSurcharge}</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.fuelVariance > 0 ? (
                            <span className="text-red-600 font-bold">+{inv.fuelVariance}</span>
                          ) : (
                            <span className="text-emerald-600">0.00</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {inv.fuelVariance > 15 ? (
                            <span className="text-[9px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">Formula Overcharge</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Compliant</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 9: EMPTY RETURN / BACKHAUL UTILIZATION */}
        {activeSubTab === "empty-return" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Empty Return & Backhaul optimization</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Scans freight legs returning from delivery depots, analyzing vehicle load capacities and flagging empty container returns as lost opportunities.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Return Legs Inspected</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {filteredInvoices.filter(inv => inv.isReturnTrip).length} Trips
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Optimized Backhauls</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    {filteredInvoices.filter(inv => inv.isBackhaul).length} Trips
                  </span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Empty Return Leakage Cost</span>
                  <span className="text-xl font-bold text-red-600 font-mono">
                    ${filteredInvoices.reduce((sum, inv) => sum + inv.lostOpportunityAmt, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Backhaul Logistics Optimization Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Capacity Utilization Rate</th>
                      <th className="py-2.5 px-4 font-mono">Empty Return?</th>
                      <th className="py-2.5 px-4 font-mono">Backhaul Status</th>
                      <th className="py-2.5 px-4">Lost Opportunity Lost Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.filter(inv => inv.isReturnTrip).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.vehicleUtilizationPct}%</td>
                        <td className="py-2.5 px-4">
                          {inv.vehicleUtilizationPct < 50 ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded font-bold">YES (Low Load)</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold">NO</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.isBackhaul ? (
                            <span className="text-emerald-600 font-bold">Optimized Backhaul</span>
                          ) : (
                            <span className="text-amber-600 font-bold">Unoptimized Return</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-red-600">
                          ${inv.lostOpportunityAmt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 10: LR / POD MATCH */}
        {activeSubTab === "lr-pod" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">LR & POD Reconcile Matches</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated document matching linking: Freight Invoices, Lorry Receipts (LR), and Proof of Delivery (POD) signatures. Screens for handover discrepancies.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Perfect Handover Match</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    {filteredInvoices.filter(inv => inv.podStatus === "Matched").length} Invoices
                  </span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Missing POD Receipts</span>
                  <span className="text-xl font-bold text-red-600 font-mono">
                    {filteredInvoices.filter(inv => inv.podStatus === "Missing").length} Invoices
                  </span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded border border-amber-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Discrepancy Flags</span>
                  <span className="text-xl font-bold text-amber-700 font-mono">
                    {filteredInvoices.filter(inv => inv.podStatus === "Discrepancy").length} Invoices
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">3-Way Document Match Reconciliation Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Shipment Reference</th>
                      <th className="py-2.5 px-4 font-mono">LR Number (Lorry Receipt)</th>
                      <th className="py-2.5 px-4 font-mono">POD (Proof of Delivery)</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.shipmentNumber}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.lrNumber}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold">
                          {inv.podStatus === "Matched" ? (
                            <span className="text-emerald-600 font-bold">POD Signed Recvd</span>
                          ) : inv.podStatus === "Missing" ? (
                            <span className="text-red-600 font-bold">POD MISSING</span>
                          ) : (
                            <span className="text-amber-600 font-bold">Unsigned / Discrepancy</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {inv.podStatus === "Matched" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">3-Way MATCHED</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2.5 py-0.5 rounded font-bold uppercase animate-pulse">HOLD PAYMENT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 11: FREIGHT PROVISION ACCURACY */}
        {activeSubTab === "provisions" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Freight Provision Accuracy & Accruals Audit</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Audits provisions/accruals calculated upon freight booking against final incoming carrier billing logs to optimize financial accrual reserve buffers.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Freight Provisioned Accrual</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">${derivedMetrics.accrualSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Provision Variance Leakage</span>
                  <span className="text-xl font-bold text-red-600 font-mono">${ (derivedMetrics.totalBilled - derivedMetrics.accrualSum).toLocaleString(undefined, { minimumFractionDigits: 2 }) }</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Accrual Match accuracy rate</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">94.8% Accurate</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Accruals vs Billed Actuals Audit Journal</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Booking Accrued Provision</th>
                      <th className="py-2.5 px-4 font-mono">Actual Billed Settle Amount</th>
                      <th className="py-2.5 px-4 font-mono">Difference Deviation</th>
                      <th className="py-2.5 px-4">Accounting Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">${inv.accruedAmount}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-bold">${inv.totalBilledAmount}</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.totalBilledAmount - inv.accruedAmount > 0 ? (
                            <span className="text-red-600 font-bold">+${ (inv.totalBilledAmount - inv.accruedAmount).toFixed(2) }</span>
                          ) : (
                            <span className="text-emerald-600">-${ Math.abs(inv.totalBilledAmount - inv.accruedAmount).toFixed(2) }</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {Math.abs(inv.totalBilledAmount - inv.accruedAmount) > 100 ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Provision Readjustment Req</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 12: TRANSIT TIME SLA */}
        {activeSubTab === "sla-transit" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Transit Time SLA Delivery Auditing</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Audits real delivery durations against contractual Service Level Agreement (SLA) days, flagging late shipments for SLA claim compensations.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50/50 p-4 rounded border border-red-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Late Delivery SLA Breach Incidents</span>
                  <span className="text-xl font-bold text-red-600 font-mono">
                    {filteredInvoices.filter(inv => inv.isLate).length} Shipments
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">SLA On-Time Compliance Score</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    { ((1 - (filteredInvoices.filter(inv => inv.isLate).length / (filteredInvoices.length || 1))) * 100).toFixed(1) }%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Carrier Transit SLA Violation Log</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4">Route Corridors</th>
                      <th className="py-2.5 px-4 font-mono">SLA Delivery Target</th>
                      <th className="py-2.5 px-4 font-mono">Actual Transit Duration</th>
                      <th className="py-2.5 px-4 font-mono">Days Delayed</th>
                      <th className="py-2.5 px-4">SLA Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{inv.routeOrigin} ➔ {inv.routeDestination}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.transitDaysSLA} Days</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.transitDaysActual} Days</td>
                        <td className="py-2.5 px-4 font-mono">
                          {inv.transitDaysActual - inv.transitDaysSLA > 0 ? (
                            <span className="text-red-600 font-bold">+{inv.transitDaysActual - inv.transitDaysSLA} Days</span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {inv.isLate ? (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2.5 py-0.5 rounded font-extrabold uppercase animate-pulse">BREACHED</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">COMPLIANT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 13: DAMAGE & SHORTAGE CLAIMS */}
        {activeSubTab === "claims" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cargo Damage & Shortage Claims Track</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Logs financial cargo losses, physical shortage events, and transit damages, auditing outstanding claims recovery status with partner carriers.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-4 rounded border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Damage Claims Filed</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">${derivedMetrics.totalClaimsSubmitted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Surcharges Recovered</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">${derivedMetrics.totalClaimsRecovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Active Transit Cargo Damage & Loss Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Claim ID reference</th>
                      <th className="py-2.5 px-4 font-mono">Financial Loss Amount</th>
                      <th className="py-2.5 px-4">Claim Status</th>
                      <th className="py-2.5 px-4">Aging Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.filter(inv => inv.hasDamageClaim).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">CLM-789-{inv.invoiceNumber.split('-')[2]}</td>
                        <td className="py-2.5 px-4 font-mono font-extrabold text-red-600">${inv.claimAmount}</td>
                        <td className="py-2.5 px-4 font-semibold">
                          {inv.claimStatus === "Recovered" ? (
                            <span className="text-emerald-600">Recovered (Cash Refund)</span>
                          ) : (
                            <span className="text-amber-600">Submitted (Awaiting Settle)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {inv.claimStatus !== "Recovered" ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">High Aging (&gt;45d)</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 14: VEHICLE PLACEMENT EFFICIENCY */}
        {activeSubTab === "placements" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Vehicle Placement Efficiency Auditing</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Audits indented truck orders against actual fleet vehicle placements logged, calculating placement delay hours and fulfillment ratios.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Indents Ordered</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {filteredInvoices.reduce((sum, inv) => sum + inv.indentQuantity, 0)} Trucks
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fulfillment Placement rate</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    { (filteredInvoices.reduce((sum, inv) => sum + inv.placedQuantity, 0) / (filteredInvoices.reduce((sum, inv) => sum + inv.indentQuantity, 0) || 1) * 100).toFixed(1) }%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Indent placement fulfillment register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Trucks Indented (Requested)</th>
                      <th className="py-2.5 px-4 font-mono">Trucks Placed (Supplied)</th>
                      <th className="py-2.5 px-4 font-mono">Placement Delay Duration</th>
                      <th className="py-2.5 px-4">Placement Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                        <td className="py-2.5 px-4 font-mono">{inv.indentQuantity} Vehicles</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.placedQuantity} Vehicles</td>
                        <td className="py-2.5 px-4 font-mono">{inv.placementDelayHours} Hours</td>
                        <td className="py-2.5 px-4">
                          {inv.placedQuantity === inv.indentQuantity ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">100% Fulfilled</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 text-[9px] px-2.5 py-0.5 rounded font-bold uppercase">Shortage Shortfall</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 15: FREIGHT COST PER UNIT TREND */}
        {activeSubTab === "cost-trends" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Freight Cost per Unit Trends</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates core logistics cost metrics: Cost per Ton-Mile, Cost per Kilometer (KM), and Average Cost per Shipment across channels.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Cost / Ton</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">$0.18</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Per ton-kilometer metrics</span>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Cost / KM</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    ${ (derivedMetrics.totalBilled / (filteredInvoices.reduce((sum, inv) => sum + inv.billedDistance, 0) || 1)).toFixed(2) }
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">Direct fuel & haulage metric</span>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Cost / Shipment</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    ${ (derivedMetrics.totalBilled / (filteredInvoices.length || 1)).toFixed(0) }
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">Based on {filteredInvoices.length} entries</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Unit Rate Financial Cost logs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Carrier</th>
                      <th className="py-2.5 px-4 font-mono">Corridor Distance</th>
                      <th className="py-2.5 px-4 font-mono">Tonnage Weight (T)</th>
                      <th className="py-2.5 px-4 font-mono">Billed Rate Settle</th>
                      <th className="py-2.5 px-4 font-mono">Cost per Ton-KM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredInvoices.map(inv => {
                      const costPerTonKm = inv.totalBilledAmount / ((inv.actualWeightKg / 1000) * inv.billedDistance);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{inv.carrierName}</td>
                          <td className="py-2.5 px-4 font-mono">{inv.billedDistance} KM</td>
                          <td className="py-2.5 px-4 font-mono">{ (inv.actualWeightKg / 1000).toFixed(1) } Tons</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">${inv.totalBilledAmount.toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-blue-700">
                            ${isNaN(costPerTonKm) || !isFinite(costPerTonKm) ? "0.00" : costPerTonKm.toFixed(3) }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            GLOBAL COMPLIANCE AUDITING DIALOG (POP-UP)
            ======================================================== */}
        {selectedInvoiceForAudit && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              <div className="px-6 py-4 bg-brand-navy text-white flex justify-between items-center">
                <span className="font-bold text-sm uppercase tracking-wider">Verifying Invoice Compliance</span>
                <button
                  onClick={() => setSelectedInvoiceForAudit(null)}
                  className="text-slate-400 hover:text-white font-extrabold focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Invoice ID</span>
                  <p className="font-mono text-sm font-extrabold text-slate-800">
                    { invoices.find(inv => inv.id === selectedInvoiceForAudit)?.invoiceNumber }
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Audit Status Recommendation Action</label>
                  <p className="text-slate-500 leading-normal">
                    You can either approve the billing values or place the invoice on hold and trigger an AP Dispute notification with the logistics carrier.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Internal Audit Comments / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Enter audit remarks, evidence verification, or dispute grounds details..."
                    value={auditComment}
                    onChange={(e) => setAuditComment(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedInvoiceForAudit(null)}
                    className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApplyDispute(selectedInvoiceForAudit, "Approved")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Pay
                  </button>
                  <button
                    onClick={() => handleApplyDispute(selectedInvoiceForAudit, "Disputed")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
                  >
                    Trigger Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
