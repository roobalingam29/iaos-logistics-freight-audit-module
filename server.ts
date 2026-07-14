import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Define Interfaces for our High-Fidelity Data Store
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Carrier {
  id: string;
  name: string;
  code: string;
  onTimeRate: number;
  damageRate: number;
  claimsRate: number;
  lateDeliveries: number;
  performanceScore: number;
  ranking: number;
}

interface Plant {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  gpsDistanceKm: number;
  billedDistanceKm: number;
  optimalRoute: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  carrierId: string;
  baseRate: number;
  tolerancePct: number;
  fuelFormula: string;
  validFrom: string;
  validTo: string;
}

interface Comment {
  id: string;
  exceptionId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

interface Exception {
  id: string;
  ruleId: string;
  invoiceId: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  status: "Open" | "Investigating" | "Resolved" | "Closed";
  assignedToId: string | null;
  assignedToName: string | null;
  priority: "Urgent" | "High" | "Normal" | "Low";
  createdAt: string;
  comments: Comment[];
}

interface FreightInvoice {
  id: string;
  invoiceNumber: string;
  carrierId: string;
  carrierName: string;
  plantId: string;
  plantName: string;
  routeId: string;
  routeOrigin: string;
  routeDestination: string;
  contractId: string;
  contractNumber: string;
  
  // 1. Rate Compliance
  contractRate: number;
  billedRate: number;
  rateVariance: number;
  rateToleranceExceeded: boolean;
  rateRecoverableAmt: number;

  // 2. Weight / Volume Variance
  actualWeightKg: number;
  chargedWeightKg: number;
  volumeCbm: number;
  weightVariance: number;
  weightToleranceExceeded: boolean;

  // 3. Route & Distance Analytics
  gpsDistance: number;
  billedDistance: number;
  routeInflationPct: number;

  // 4. Detention & Demurrage
  detentionCharges: number;
  demurrageCharges: number;
  waitingTimeHours: number;
  detentionRecoverable: number;

  // 8. Fuel Surcharge Validation
  fuelIndexApplied: number;
  billedFuelSurcharge: number;
  calculatedFuelSurcharge: number;
  fuelVariance: number;

  // 9. Empty Return / Backhaul
  isReturnTrip: boolean;
  vehicleUtilizationPct: number;
  isBackhaul: boolean;
  lostOpportunityAmt: number;

  // 10. LR / POD Match
  lrNumber: string;
  podStatus: "Matched" | "Missing" | "Discrepancy";
  shipmentNumber: string;

  // 11. Freight Provision Accuracy
  accruedAmount: number;
  differenceAmount: number;

  // 12. Transit Time SLA
  transitDaysActual: number;
  transitDaysSLA: number;
  isLate: boolean;

  // 13. Damage & Claims (Module level, but we link key invoices)
  hasDamageClaim: boolean;
  claimAmount: number;
  claimStatus: "Draft" | "Submitted" | "Approved" | "Recovered" | "Rejected";

  // 14. Vehicle Placement Efficiency
  placementDelayHours: number;
  indentQuantity: number;
  placedQuantity: number;

  // General billing
  totalBilledAmount: number;
  invoiceDate: string;
  status: "Pending" | "Audited" | "Disputed" | "Approved";
  isDuplicate: boolean;
  duplicateOfInvoiceNo?: string;
}

interface Finding {
  id: string;
  title: string;
  observation: string;
  rootCause: string;
  impact: number;
  recommendation: string;
  riskRating: "High" | "Medium" | "Low";
  owner: string;
  status: "Open" | "Under_Review" | "Resolved" | "Closed";
  createdAt: string;
  authorName: string;
}

interface Remediation {
  id: string;
  findingId: string;
  findingTitle: string;
  capaAction: string;
  owner: string;
  dueDate: string;
  progress: number;
  evidence: string | null;
  retestingStatus: "Pending" | "Pass" | "Fail";
  status: "Draft" | "Active" | "Completed";
  createdAt: string;
}

interface RiskControl {
  id: string;
  riskCode: string;
  riskName: string;
  controlName: string;
  assertion: string;
  owner: string;
  frequency: string;
  testProcedure: string;
}

interface Rule {
  id: string;
  name: string;
  category: string;
  threshold: number;
  severity: "High" | "Medium" | "Low";
  sqlRule: string;
  isEnabled: boolean;
}

interface SamplingConfig {
  id: string;
  method: "Random" | "MonetaryUnit" | "RiskBased" | "Custom";
  sampleSize: number;
  confidenceLevel: number;
  materialityLimit: number;
  createdAt: string;
}

interface WorkingPaper {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "PDF" | "XLSX" | "DOCX" | "PNG";
  uploadedBy: string;
  tickMarks: string[]; // e.g. ["V", "C", "M"] -> Vouch, Confirm, Match
  reviewerSignoff: boolean;
  reviewerName: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

// Global In-Memory Database State
const USERS: User[] = [
  { id: "usr-admin", email: "admin@iaos.com", name: "Sarah Jenkins", role: "Administrator" },
  { id: "usr-mgr", email: "manager@iaos.com", name: "David Miller", role: "Audit Manager" },
  { id: "usr-lead", email: "lead@iaos.com", name: "Amelia Carter", role: "Lead Auditor" },
  { id: "usr-sr", email: "sr@iaos.com", name: "Robert Chen", role: "Senior Auditor" },
  { id: "usr-auditor", email: "auditor@iaos.com", name: "Marcus Thompson", role: "Auditor" },
  { id: "usr-business", email: "business@iaos.com", name: "Elena Rostova", role: "Business User" },
  { id: "usr-viewer", email: "viewer@iaos.com", name: "William Vance", role: "Viewer" }
];

let CARRIERS: Carrier[] = [
  { id: "c-1", name: "DHL Logistics", code: "DHL-001", onTimeRate: 96.2, damageRate: 0.3, claimsRate: 0.5, lateDeliveries: 12, performanceScore: 97.4, ranking: 1 },
  { id: "c-2", name: "FedEx Freight", code: "FDX-002", onTimeRate: 94.8, damageRate: 0.5, claimsRate: 0.8, lateDeliveries: 18, performanceScore: 94.1, ranking: 3 },
  { id: "c-3", name: "Kuehne + Nagel", code: "KN-003", onTimeRate: 95.5, damageRate: 0.4, claimsRate: 0.6, lateDeliveries: 15, performanceScore: 95.2, ranking: 2 },
  { id: "c-4", name: "DSV Global", code: "DSV-004", onTimeRate: 93.1, damageRate: 0.7, claimsRate: 1.1, lateDeliveries: 28, performanceScore: 91.0, ranking: 5 },
  { id: "c-5", name: "XPO Logistics", code: "XPO-005", onTimeRate: 91.4, damageRate: 1.1, claimsRate: 1.5, lateDeliveries: 35, performanceScore: 88.5, ranking: 7 },
  { id: "c-6", name: "C.H. Robinson", code: "CHR-006", onTimeRate: 93.9, damageRate: 0.6, claimsRate: 1.0, lateDeliveries: 22, performanceScore: 92.4, ranking: 4 },
  { id: "c-7", name: "DB Schenker", code: "DBS-007", onTimeRate: 92.5, damageRate: 0.8, claimsRate: 1.2, lateDeliveries: 25, performanceScore: 90.1, ranking: 6 },
  { id: "c-8", name: "Maersk Logistics", code: "MAE-008", onTimeRate: 89.2, damageRate: 1.3, claimsRate: 2.1, lateDeliveries: 45, performanceScore: 84.8, ranking: 8 }
];

let PLANTS: Plant[] = [
  { id: "p-1", name: "Chicago Central Plant", code: "CHI-10", city: "Chicago", country: "United States" },
  { id: "p-2", name: "Rotterdam Port Terminal", code: "ROT-20", city: "Rotterdam", country: "Netherlands" },
  { id: "p-3", name: "Shanghai Logistics Hub", code: "SHA-30", city: "Shanghai", country: "China" },
  { id: "p-4", name: "Munich Assembly Center", code: "MUN-40", city: "Munich", country: "Germany" },
  { id: "p-5", name: "Mumbai Inland Depot", code: "BOM-50", city: "Mumbai", country: "India" },
  { id: "p-6", name: "São Paulo Logistics", code: "SAO-60", city: "São Paulo", country: "Brazil" }
];

let ROUTES: Route[] = [
  { id: "r-1", origin: "Chicago Central Plant", destination: "New York Port", gpsDistanceKm: 1280.5, billedDistanceKm: 1285.0, optimalRoute: "I-80 E" },
  { id: "r-2", origin: "Munich Assembly Center", destination: "Rotterdam Port Terminal", gpsDistanceKm: 810.2, billedDistanceKm: 855.0, optimalRoute: "A3 / A12" },
  { id: "r-3", origin: "Shanghai Logistics Hub", destination: "Ningbo Deepwater", gpsDistanceKm: 210.0, billedDistanceKm: 215.0, optimalRoute: "G15 Expressway" },
  { id: "r-4", origin: "Mumbai Inland Depot", destination: "Nhava Sheva Port", gpsDistanceKm: 85.0, billedDistanceKm: 120.0, optimalRoute: "JNPT Access Rd (Inflated)" },
  { id: "r-5", origin: "São Paulo Logistics", destination: "Santos Terminal", gpsDistanceKm: 78.4, billedDistanceKm: 80.0, optimalRoute: "SP-150 Imigrantes" },
  { id: "r-6", origin: "Rotterdam Port Terminal", destination: "Munich Assembly Center", gpsDistanceKm: 810.2, billedDistanceKm: 812.0, optimalRoute: "A12 / A3" }
];

let CONTRACTS: Contract[] = [
  { id: "con-1", contractNumber: "CTR-DHL-2026", carrierId: "c-1", baseRate: 1500.0, tolerancePct: 1.5, fuelFormula: "EIA_Weekly_Avg * 0.12", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-2", contractNumber: "CTR-FDX-2026", carrierId: "c-2", baseRate: 1650.0, tolerancePct: 2.0, fuelFormula: "EIA_Weekly_Avg * 0.14", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-3", contractNumber: "CTR-KN-2026", carrierId: "c-3", baseRate: 1550.0, tolerancePct: 1.0, fuelFormula: "Platts_Europe_Gasoil * 0.11", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-4", contractNumber: "CTR-DSV-2026", carrierId: "c-4", baseRate: 1400.0, tolerancePct: 3.0, fuelFormula: "S&P_Cargo_Index * 0.15", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-5", contractNumber: "CTR-XPO-2026", carrierId: "c-5", baseRate: 1350.0, tolerancePct: 2.5, fuelFormula: "EIA_Regional_Diesel", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-6", contractNumber: "CTR-CHR-2026", carrierId: "c-6", baseRate: 1450.0, tolerancePct: 1.8, fuelFormula: "Weekly_Index_Formula", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-7", contractNumber: "CTR-DBS-2026", carrierId: "c-7", baseRate: 1600.0, tolerancePct: 2.0, fuelFormula: "EU_Energy_Surcharge", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "con-8", contractNumber: "CTR-MAE-2026", carrierId: "c-8", baseRate: 2100.0, tolerancePct: 2.0, fuelFormula: "IMO_Surcharge_Avg", validFrom: "2026-01-01", validTo: "2026-12-31" }
];

let INVOICES: FreightInvoice[] = [];
let EXCEPTIONS: Exception[] = [];
let FINDINGS: Finding[] = [];
let REMEDIATIONS: Remediation[] = [];
let AUDIT_LOGS: AuditLog[] = [];

let RISK_CONTROLS: RiskControl[] = [
  { id: "rc-1", riskCode: "R1-RATE-COMP", riskName: "Unauthorized/Over-contract Carrier Billing Rates", controlName: "System Rate Contract Verification", assertion: "Valuation & Accuracy", owner: "Finance Controller", frequency: "Daily/Automated", testProcedure: "Reconcile all freight invoices automatically against active, signed contracts. Flag variances > contractual tolerances." },
  { id: "rc-2", riskCode: "R2-VOL-VANCE", riskName: "Billing Based on Inflated Dimensional Weights", controlName: "Dimensional Weight Validation", assertion: "Accuracy", owner: "Warehouse Auditor", frequency: "Weekly Batch", testProcedure: "Cross-reference carrier charged weight with the physical warehouse measurement (WMS) recorded at shipment placement." },
  { id: "rc-3", riskCode: "R3-RT-INFLA", riskName: "Excessive Routing Distances Charged by Carriers", controlName: "Geographic Optimal Route Verification", assertion: "Accuracy", owner: "Logistics Analyst", frequency: "Monthly Sample", testProcedure: "Verify carrier billed distances against GPS route logs and standard mileage guides. Investigate variances > 5%." },
  { id: "rc-4", riskCode: "R4-DET-DEMR", riskName: "Detention & Demurrage Fees Billed Without Justification", controlName: "Waiting Time Gate Log Match", assertion: "Existence & Accuracy", owner: "Plant Manager", frequency: "Transactional", testProcedure: "Reconcile billed waiting hours with gate-in/gate-out logs. Deny payment if driver delay was under carrier responsibility." },
  { id: "rc-5", riskCode: "R5-DUP-BILL", riskName: "Double Billing of Invoices, Shipments, or LRs", controlName: "Duplicate Key Deduplication", assertion: "Occurrence", owner: "AP Lead", frequency: "Daily/Automated", testProcedure: "Deploy daily automated deduplication script scan across LR Number, POD Number, Shipment ID, and Total Bill Amount." },
  { id: "rc-6", riskCode: "R6-FUEL-SURC", riskName: "Fuel Surcharges Calculated Incorrectly by Carriers", controlName: "Fuel Surcharge Independent Audit", assertion: "Accuracy & Valuation", owner: "Logistics Accountant", frequency: "Monthly", testProcedure: "Re-calculate fuel surcharge using contract formula and public weekly EIA Fuel index; flag differences exceeding $10." }
];

let RULES: Rule[] = [
  { id: "rule-rate", name: "Contract Rate Compliancy Audit", category: "Compliance", threshold: 1.5, severity: "High", sqlRule: "SELECT * FROM FreightInvoices WHERE billedRate > contractRate * (1 + tolerancePct / 100)", isEnabled: true },
  { id: "rule-weight", name: "Weight Divergency Verification", category: "Weight", threshold: 5.0, severity: "Medium", sqlRule: "SELECT * FROM FreightInvoices WHERE chargedWeightKg > actualWeightKg * 1.05", isEnabled: true },
  { id: "rule-distance", name: "Billed Distance Route Inflation Check", category: "SLA", threshold: 5.0, severity: "Low", sqlRule: "SELECT * FROM FreightInvoices WHERE routeInflationPct > 5.0", isEnabled: true },
  { id: "rule-detention", name: "Unauthorized Detention Waiting Log Check", category: "Detention", threshold: 4.0, severity: "High", sqlRule: "SELECT * FROM FreightInvoices WHERE waitingTimeHours > 4.0 AND detentionCharges > 0", isEnabled: true },
  { id: "rule-duplicates", name: "Deduplication of LR / Invoice Key", category: "Duplicates", threshold: 100.0, severity: "High", sqlRule: "SELECT id, COUNT(*) FROM FreightInvoices GROUP BY shipmentNumber HAVING COUNT(*) > 1", isEnabled: true },
  { id: "rule-fuel", name: "Fuel Surcharge Variance Recalculator", category: "Fuel", threshold: 25.0, severity: "Medium", sqlRule: "SELECT * FROM FreightInvoices WHERE ABS(billedFuelSurcharge - calculatedFuelSurcharge) > 25.0", isEnabled: true }
];

let SAMPLING_CONFIGS: SamplingConfig[] = [
  { id: "sc-1", method: "Random", sampleSize: 25, confidenceLevel: 95.0, materialityLimit: 5000.0, createdAt: "2026-07-10T12:00:00Z" },
  { id: "sc-2", method: "RiskBased", sampleSize: 40, confidenceLevel: 99.0, materialityLimit: 2500.0, createdAt: "2026-07-12T15:30:00Z" }
];

let WORKING_PAPERS: WorkingPaper[] = [
  { id: "wp-1", fileName: "Q2_DHL_Rate_Compliance_Worksheet.xlsx", fileSize: "12.4 MB", fileType: "XLSX", uploadedBy: "Marcus Thompson", tickMarks: ["V", "C"], reviewerSignoff: true, reviewerName: "Amelia Carter", createdAt: "2026-06-15" },
  { id: "wp-2", fileName: "POD_LR_Discrepancy_Support_Docs.pdf", fileSize: "4.8 MB", fileType: "PDF", uploadedBy: "Robert Chen", tickMarks: ["M"], reviewerSignoff: false, reviewerName: null, createdAt: "2026-07-02" },
  { id: "wp-3", fileName: "Demurrage_Claims_Aging_Analysis.xlsx", fileSize: "8.1 MB", fileType: "XLSX", uploadedBy: "Sarah Jenkins", tickMarks: ["V", "R"], reviewerSignoff: true, reviewerName: "Sarah Jenkins", createdAt: "2026-07-11" }
];

// Helper to log user actions to the enterprise Audit Trail (Module 16 & Admin)
function logAudit(user: string, action: string, module: string, details: string) {
  const log: AuditLog = {
    id: `log-${Math.floor(Math.random() * 1000000)}`,
    timestamp: new Date().toISOString(),
    user,
    action,
    module,
    details
  };
  AUDIT_LOGS.unshift(log);
  if (AUDIT_LOGS.length > 500) {
    AUDIT_LOGS.pop();
  }
}

// PROGRAMMATICALLY GENERATE 100+ COHESIVE FREIGHT INVOICES & DETECT EXCEPTIONS
function generateFreightAuditSeed() {
  const carriers = CARRIERS;
  const plants = PLANTS;
  const routes = ROUTES;
  const contracts = CONTRACTS;

  const exceptionTemplates = [
    { ruleId: "rule-rate", desc: "Contract Rate Overcharge: Billed rate of ${billed} exceeds contractual base rate of ${base} (+${var} overcharge)." },
    { ruleId: "rule-weight", desc: "Weight Discrepancy: Carrier billed dimensional weight ${charged}kg, physical warehouse scale logs recorded ${actual}kg." },
    { ruleId: "rule-distance", desc: "Route Inflation: Billed distance (${billed}km) exceeds optimal GPS-calculated route distance (${gps}km) by ${pct}%." },
    { ruleId: "rule-detention", desc: "Unearned Detention Surcharge: Demurrage of $${billed_fee} charged for waiting hours ${hours}, warehouse logs show driver delay under 1 hour." },
    { ruleId: "rule-duplicates", desc: "Duplicate Invoicing: Multi-payment risk detected. Matching shipment key ${shipment} billed twice." },
    { ruleId: "rule-fuel", desc: "Fuel Calculation Surcharge Discrepancy: Billed surcharge is $${billed} while indexed formula yields $${calc}." }
  ];

  // Let's seed 110 freight invoices across past 6 months
  const nowTime = new Date();
  
  for (let i = 1; i <= 110; i++) {
    // Round-robin selection of carrier, plant, route, contract
    const carrierIdx = (i - 1) % carriers.length;
    const carrier = carriers[carrierIdx];
    const plant = plants[(i - 1) % plants.length];
    
    // Choose route starting or ending at this plant if possible, otherwise select by index
    const route = routes[(i - 1) % routes.length];
    const contract = contracts.find(c => c.carrierId === carrier.id) || contracts[0];

    // Dates spread out over the last 6 months
    const dateOffsetDays = Math.floor(Math.random() * 180);
    const invoiceDate = new Date();
    invoiceDate.setDate(nowTime.getDate() - dateOffsetDays);

    const invoiceNo = `INV-${carrier.code}-${10000 + i}`;
    const shipmentNo = `SH-2026-${25000 + i}`;
    const lrNo = `LR-776-${40000 + i}`;

    // Base contractual rate from contract
    const baseRate = contract.baseRate + (Math.floor(Math.random() * 300) - 150); // +/- $150 variation in shipment parameters

    // Determine if this invoice has a specific discrepancy to audit (forcing 25-30% exception rate for data depth)
    let billedRate = baseRate;
    let rateVariance = 0;
    let rateToleranceExceeded = false;
    let rateRecoverableAmt = 0;

    let actualWeight = 4000 + Math.floor(Math.random() * 10000); // 4-14 tons
    let chargedWeight = actualWeight;
    let weightVariance = 0;
    let weightToleranceExceeded = false;

    let gpsDist = route.gpsDistanceKm;
    let billedDist = route.billedDistanceKm;
    let routeInflationPct = ((billedDist - gpsDist) / gpsDist) * 100;

    let detentionCharges = 0;
    let demurrageCharges = 0;
    let waitingTimeHours = Math.random() * 3.5;
    let detentionRecoverable = 0;

    let fuelIndex = 3.25 + (Math.random() * 0.5); // $3.25 - $3.75 weekly diesel average
    let calculatedFuel = baseRate * (fuelIndex * 0.05); // indexed base formula
    let billedFuel = calculatedFuel;
    let fuelVariance = 0;

    let isReturnTrip = i % 7 === 0;
    let vehicleUtilizationPct = 40 + Math.floor(Math.random() * 60); // 40-100% capacity
    let isBackhaul = isReturnTrip && vehicleUtilizationPct > 80;
    let lostOpportunityAmt = (!isBackhaul && isReturnTrip) ? 450.00 : 0.00;

    let podStatus: "Matched" | "Missing" | "Discrepancy" = "Matched";
    if (i % 11 === 0) podStatus = "Missing";
    else if (i % 17 === 0) podStatus = "Discrepancy";

    let accruedAmount = baseRate + calculatedFuel;
    let differenceAmount = 0;

    let transitDaysSLA = 2 + Math.floor(gpsDist / 400); // e.g. 2-5 days
    let transitDaysActual = transitDaysSLA;
    let isLate = false;
    
    // SLA failure rates
    if (i % 9 === 0) {
      transitDaysActual = transitDaysSLA + Math.floor(Math.random() * 3) + 1;
      isLate = true;
    }

    let hasDamageClaim = i % 13 === 0;
    let claimAmount = hasDamageClaim ? (400 + Math.floor(Math.random() * 2500)) : 0;
    let claimStatus: "Draft" | "Submitted" | "Approved" | "Recovered" | "Rejected" = hasDamageClaim 
      ? (i % 2 === 0 ? "Recovered" : "Submitted") 
      : "Draft";

    let placementDelayHours = Math.random() * 12; // hours of placement delay
    let indentQuantity = 5 + Math.floor(Math.random() * 10);
    let placedQuantity = indentQuantity;
    if (i % 15 === 0) {
      placedQuantity = indentQuantity - (1 + Math.floor(Math.random() * 3));
    }

    let isDuplicate = false;
    let duplicateOfInvoiceNo = undefined;

    // SCENARIO 1: Rate Compliancy Violation (Module 1)
    if (i % 8 === 0) {
      billedRate = baseRate * 1.15; // 15% rate inflation
      rateVariance = billedRate - baseRate;
      rateToleranceExceeded = rateVariance > (baseRate * (contract.tolerancePct / 100));
      rateRecoverableAmt = rateVariance;
    }

    // SCENARIO 2: Weight / Volume Discrepancy (Module 2)
    if (i % 12 === 0) {
      chargedWeight = actualWeight * 1.22; // 22% weight markup
      weightVariance = chargedWeight - actualWeight;
      weightToleranceExceeded = ((chargedWeight - actualWeight) / actualWeight) * 100 > 5.0;
    }

    // SCENARIO 3: Billed Distance Route Inflation (Module 3)
    if (i % 14 === 0) {
      billedDist = gpsDist * 1.30; // 30% routing distance inflation
      routeInflationPct = ((billedDist - gpsDist) / gpsDist) * 100;
    }

    // SCENARIO 4: Demurrage / Detention Overcharging (Module 4)
    if (i % 10 === 0) {
      waitingTimeHours = 8.5; // excessive driver delay
      detentionCharges = 350.00;
      demurrageCharges = 150.00;
      detentionRecoverable = 350.00; // recoverable since gate logs reject this
    }

    // SCENARIO 5: Duplicate Invoice Billing (Module 6)
    if (i === 42 || i === 85) {
      isDuplicate = true;
      duplicateOfInvoiceNo = `INV-${carrier.code}-${10000 + i - 1}`;
      billedRate = baseRate;
      rateVariance = baseRate;
      rateRecoverableAmt = baseRate;
    }

    // SCENARIO 6: Fuel Surcharge Variance (Module 8)
    if (i % 19 === 0) {
      billedFuel = calculatedFuel * 1.45; // 45% surcharge markup
      fuelVariance = billedFuel - calculatedFuel;
    }

    // Calculate invoice totals
    let totalBilledAmount = billedRate + billedFuel + detentionCharges + demurrageCharges;
    differenceAmount = totalBilledAmount - accruedAmount;

    // Status distributions
    let status: "Pending" | "Audited" | "Disputed" | "Approved" = "Audited";
    if (rateToleranceExceeded || weightToleranceExceeded || routeInflationPct > 10 || isDuplicate || fuelVariance > 50) {
      status = "Disputed";
    } else if (i % 6 === 0) {
      status = "Pending";
    } else if (i % 5 === 0) {
      status = "Approved";
    }

    const invoice: FreightInvoice = {
      id: `inv-${i}`,
      invoiceNumber: invoiceNo,
      carrierId: carrier.id,
      carrierName: carrier.name,
      plantId: plant.id,
      plantName: plant.name,
      routeId: route.id,
      routeOrigin: route.origin,
      routeDestination: route.destination,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      contractRate: parseFloat(baseRate.toFixed(2)),
      billedRate: parseFloat(billedRate.toFixed(2)),
      rateVariance: parseFloat(rateVariance.toFixed(2)),
      rateToleranceExceeded,
      rateRecoverableAmt: parseFloat(rateRecoverableAmt.toFixed(2)),
      actualWeightKg: parseFloat(actualWeight.toFixed(2)),
      chargedWeightKg: parseFloat(chargedWeight.toFixed(2)),
      volumeCbm: parseFloat((actualWeight / 220).toFixed(2)),
      weightVariance: parseFloat(weightVariance.toFixed(2)),
      weightToleranceExceeded,
      gpsDistance: parseFloat(gpsDist.toFixed(2)),
      billedDistance: parseFloat(billedDist.toFixed(2)),
      routeInflationPct: parseFloat(routeInflationPct.toFixed(2)),
      detentionCharges: parseFloat(detentionCharges.toFixed(2)),
      demurrageCharges: parseFloat(demurrageCharges.toFixed(2)),
      waitingTimeHours: parseFloat(waitingTimeHours.toFixed(1)),
      detentionRecoverable: parseFloat(detentionRecoverable.toFixed(2)),
      fuelIndexApplied: parseFloat(fuelIndex.toFixed(2)),
      billedFuelSurcharge: parseFloat(billedFuel.toFixed(2)),
      calculatedFuelSurcharge: parseFloat(calculatedFuel.toFixed(2)),
      fuelVariance: parseFloat(fuelVariance.toFixed(2)),
      isReturnTrip,
      vehicleUtilizationPct,
      isBackhaul,
      lostOpportunityAmt: parseFloat(lostOpportunityAmt.toFixed(2)),
      lrNumber: lrNo,
      podStatus,
      shipmentNumber: shipmentNo,
      accruedAmount: parseFloat(accruedAmount.toFixed(2)),
      differenceAmount: parseFloat(differenceAmount.toFixed(2)),
      transitDaysActual,
      transitDaysSLA,
      isLate,
      hasDamageClaim,
      claimAmount: parseFloat(claimAmount.toFixed(2)),
      claimStatus,
      placementDelayHours: parseFloat(placementDelayHours.toFixed(1)),
      indentQuantity,
      placedQuantity,
      totalBilledAmount: parseFloat(totalBilledAmount.toFixed(2)),
      invoiceDate: invoiceDate.toISOString().split('T')[0],
      status,
      isDuplicate,
      duplicateOfInvoiceNo
    };

    INVOICES.push(invoice);

    // Auto-generate exceptions based on rules
    if (rateToleranceExceeded) {
      EXCEPTIONS.push({
        id: `exc-rate-${i}`,
        ruleId: "rule-rate",
        invoiceId: invoice.id,
        severity: "High",
        description: `Contract rate overcharge detected. Invoice billed rate of $${invoice.billedRate} exceeds signed base contract rate of $${invoice.contractRate} for Contract ${invoice.contractNumber}.`,
        status: status === "Disputed" ? "Investigating" : "Open",
        assignedToId: "usr-auditor",
        assignedToName: "Marcus Thompson",
        priority: "High",
        createdAt: invoice.invoiceDate,
        comments: []
      });
    }

    if (weightToleranceExceeded) {
      EXCEPTIONS.push({
        id: `exc-weight-${i}`,
        ruleId: "rule-weight",
        invoiceId: invoice.id,
        severity: "Medium",
        description: `Weight discrepancy flagged. Charged weight is ${invoice.chargedWeightKg} kg, while physical gate scaling logged actual weight of ${invoice.actualWeightKg} kg (+${invoice.weightVariance} kg deviation).`,
        status: "Open",
        assignedToId: "usr-sr",
        assignedToName: "Robert Chen",
        priority: "Normal",
        createdAt: invoice.invoiceDate,
        comments: []
      });
    }

    if (routeInflationPct > 10) {
      EXCEPTIONS.push({
        id: `exc-dist-${i}`,
        ruleId: "rule-distance",
        invoiceId: invoice.id,
        severity: "Low",
        description: `Route inflated: Carrier billed distance (${invoice.billedDistance} km) exceeds optimal GIS GPS-logged distance (${invoice.gpsDistance} km) by ${invoice.routeInflationPct}%.`,
        status: "Open",
        assignedToId: null,
        assignedToName: null,
        priority: "Low",
        createdAt: invoice.invoiceDate,
        comments: []
      });
    }

    if (detentionCharges > 100) {
      EXCEPTIONS.push({
        id: `exc-det-${i}`,
        ruleId: "rule-detention",
        invoiceId: invoice.id,
        severity: "High",
        description: `High Detention Charge Audit. Waiting time hours logged at ${invoice.waitingTimeHours} hours resulting in $${invoice.detentionCharges} detention fees. Rejecting due to missing gate logs.`,
        status: "Open",
        assignedToId: "usr-lead",
        assignedToName: "Amelia Carter",
        priority: "High",
        createdAt: invoice.invoiceDate,
        comments: []
      });
    }

    if (isDuplicate) {
      EXCEPTIONS.push({
        id: `exc-dup-${i}`,
        ruleId: "rule-duplicates",
        invoiceId: invoice.id,
        severity: "High",
        description: `DUPLICATE BILLING RISK: Shipment ${invoice.shipmentNumber} already billed under Invoice ID ${invoice.duplicateOfInvoiceNo}. Duplicate billed amount: $${invoice.totalBilledAmount}.`,
        status: "Open",
        assignedToId: "usr-mgr",
        assignedToName: "David Miller",
        priority: "Urgent",
        createdAt: invoice.invoiceDate,
        comments: []
      });
    }
  }

  // Populate dynamic performance scores based on the generated invoices
  CARRIERS = CARRIERS.map(c => {
    const invs = INVOICES.filter(inv => inv.carrierId === c.id);
    const totalCount = invs.length || 1;
    const lateCount = invs.filter(inv => inv.isLate).length;
    const claimInvs = invs.filter(inv => inv.hasDamageClaim);
    const claimCount = claimInvs.length;
    const onTimeRate = parseFloat(((1 - lateCount / totalCount) * 100).toFixed(1));
    const damageRate = parseFloat(((claimCount / totalCount) * 1.5).toFixed(2));
    const claimsRate = parseFloat(((claimInvs.reduce((acc, current) => acc + current.claimAmount, 0) / invs.reduce((acc, current) => acc + current.totalBilledAmount, 0)) * 100).toFixed(2));
    const performanceScore = parseFloat((onTimeRate * 0.7 + (100 - damageRate * 20) * 0.2 + (100 - claimsRate * 5) * 0.1).toFixed(1));
    
    return {
      ...c,
      onTimeRate,
      damageRate,
      claimsRate,
      lateDeliveries: lateCount,
      performanceScore
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore).map((c, index) => ({
    ...c,
    ranking: index + 1
  }));

  // Seed standard Findings & Remediation Plans (Modules 24, 25)
  FINDINGS.push({
    id: "fnd-01",
    title: "Systemic Rate Contract Variance at Munich Assembly Center",
    observation: "DHL logistics rates for routes departing Munich regularly exceed active contractual base values by 15%. This occurs because carrier rate changes are updated in the carrier's invoice portal but not updated/synced into the SAP rate tables.",
    rootCause: "ERP Master Data Rate synchronization delay of up to 45 days. High reliance on manual keying of updated contractual rate sheets.",
    impact: 64200.00,
    recommendation: "Implement automated real-time API integrations with the Contract Management system (CMS) directly to Express ERP rate tables. Establish daily automated rate check rules.",
    riskRating: "High",
    owner: "Helena Vance (Finance Operations)",
    status: "Open",
    createdAt: "2026-06-20T10:00:00Z",
    authorName: "Sarah Jenkins"
  });

  FINDINGS.push({
    id: "fnd-02",
    title: "Double Billing and Duplicate Invoices for High-Volume Sea Freight",
    observation: "A sample of 25 Maersk Logistics invoices revealed 2 occurrences of duplicate billing where the exact same shipping container reference keys was invoiced thrice under distinct document serials.",
    rootCause: "Logistics provider billing engine software split multi-leg sea freight bookings into discrete segments and mistakenly emitted base leg charges in each individual segment invoice.",
    impact: 28500.00,
    recommendation: "Establish unique multi-field key constraints (combining Container ID, Leg Date, and Base Booking Key) within the AP payment processor database.",
    riskRating: "High",
    owner: "Timothy Vance (Global AP Lead)",
    status: "Under_Review",
    createdAt: "2026-07-02T11:00:00Z",
    authorName: "Marcus Thompson"
  });

  FINDINGS.push({
    id: "fnd-03",
    title: "Missing POD documentation on Rotterdam Inland Routes",
    observation: "12% of inspected freight documents in the Rotterdam Port Terminal lacked corresponding Proof of Delivery (POD) signatures. Invoices are being settled based on billing logs alone without physical handover certification.",
    rootCause: "Lack of field validation on cargo release. Port dispatchers sign off gate departures without requiring digital signature verification links.",
    impact: 18450.00,
    recommendation: "Update logistics workflow to enforce digital POD uploads directly on the partner carrier app as an absolute prerequisite for invoice status transition to Pending Payment.",
    riskRating: "Medium",
    owner: "Lars van de Berg (Port Terminal Director)",
    status: "Resolved",
    createdAt: "2026-07-08T09:30:00Z",
    authorName: "Robert Chen"
  });

  // Seed dynamic Remediations
  REMEDIATIONS.push({
    id: "capa-01",
    findingId: "fnd-01",
    findingTitle: "Systemic Rate Contract Variance at Munich Assembly Center",
    capaAction: "Develop automated SAP API script connector to pull live contract values directly from CMS system. Perform monthly reconciliation audits.",
    owner: "Helena Vance",
    dueDate: "2026-08-30",
    progress: 45,
    evidence: null,
    retestingStatus: "Pending",
    status: "Active",
    createdAt: "2026-06-25"
  });

  REMEDIATIONS.push({
    id: "capa-02",
    findingId: "fnd-03",
    findingTitle: "Missing POD documentation on Rotterdam Inland Routes",
    capaAction: "Update Logistics vendor guidelines. Launch mobile POD upload feature on carrier portals.",
    owner: "Lars van de Berg",
    dueDate: "2026-07-15",
    progress: 100,
    evidence: "PDF_CarrierPortal_v1.2_Specs.pdf",
    retestingStatus: "Pass",
    status: "Completed",
    createdAt: "2026-07-09"
  });

  // Initialize Audit Trail with some starting events
  logAudit("System Initializer", "Database seed completed programmatically", "Admin", "110 freight invoices, 8 carriers, 6 plants, 6 routes, 6 risk controls, 3 findings and 2 remediation CAPA maps successfully established.");
}

generateFreightAuditSeed();

// BUILD EXPRESS SERVER
const app = express();
const PORT = 3000;

app.use(express.json());

// Auth check middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Enterprise mock verification
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized access token requested." });
  }
  next();
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  // Find user by email or fallback to first matching roles
  let user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // If we type other addresses, let's auto-create a user to let them explore all roles easily!
    let detectedRole = "Auditor";
    if (email.includes("admin")) detectedRole = "Administrator";
    else if (email.includes("mgr") || email.includes("manager")) detectedRole = "Audit Manager";
    else if (email.includes("lead")) detectedRole = "Lead Auditor";
    else if (email.includes("sr") || email.includes("senior")) detectedRole = "Senior Auditor";
    else if (email.includes("viewer")) detectedRole = "Viewer";
    else if (email.includes("business")) detectedRole = "Business User";

    user = {
      id: `usr-gen-${Math.floor(Math.random() * 10000)}`,
      email,
      name: email.split("@")[0].split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      role: detectedRole
    };
    USERS.push(user);
  }

  logAudit(user.name, "User logged in successfully", "Authentication", `Session established under Enterprise Role: ${user.role}`);
  
  // Return high-fidelity payload with bearer token
  res.json({
    token: `bearer-jwt-token-iaos-${user.id}-${Math.floor(Math.random() * 100000)}`,
    user
  });
});

// ==========================================
// EXECUTIVE SUMMARY & KPI SUMMARY (Module 16)
// ==========================================
app.get("/api/dashboard/stats", (req: Request, res: Response) => {
  const totalBilled = INVOICES.reduce((sum, inv) => sum + inv.totalBilledAmount, 0);
  const totalRecoverable = INVOICES.reduce((sum, inv) => sum + inv.rateRecoverableAmt + inv.detentionRecoverable + inv.lostOpportunityAmt, 0);
  const totalExceptions = EXCEPTIONS.length;
  const resolvedExceptions = EXCEPTIONS.filter(e => e.status === "Resolved" || e.status === "Closed").length;
  const openExceptions = totalExceptions - resolvedExceptions;
  
  const totalFindings = FINDINGS.length;
  const resolvedFindings = FINDINGS.filter(f => f.status === "Resolved" || f.status === "Closed").length;
  
  const totalSLA = INVOICES.length;
  const onTimeSLA = INVOICES.filter(inv => !inv.isLate).length;
  const slaPercentage = parseFloat(((onTimeSLA / totalSLA) * 100).toFixed(2));

  const totalAccrued = INVOICES.reduce((sum, inv) => sum + inv.accruedAmount, 0);
  const auditCoveragePercent = 100.0; // Complete digital audit universe

  // Generate data trends dynamically across months for Recharts
  const monthlyMap: { [key: string]: { billed: number; recovered: number; exceptions: number } } = {};
  
  // Sort invoice items chronologically to build accurate line charts
  const sortedInvs = [...INVOICES].sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
  
  sortedInvs.forEach(inv => {
    const month = inv.invoiceDate.substring(0, 7); // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = { billed: 0, recovered: 0, exceptions: 0 };
    }
    monthlyMap[month].billed += inv.totalBilledAmount;
    monthlyMap[month].recovered += (inv.rateRecoverableAmt + inv.detentionRecoverable + inv.lostOpportunityAmt);
  });

  EXCEPTIONS.forEach(e => {
    const month = e.createdAt.substring(0, 7);
    if (monthlyMap[month]) {
      monthlyMap[month].exceptions += 1;
    }
  });

  const trendData = Object.keys(monthlyMap).map(m => {
    const d = new Date(m + "-01");
    const name = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    return {
      month: name,
      rawMonth: m,
      billed: parseFloat(monthlyMap[m].billed.toFixed(2)),
      recovered: parseFloat(monthlyMap[m].recovered.toFixed(2)),
      exceptions: monthlyMap[m].exceptions
    };
  }).sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));

  // Carrier distribution data for Pie Chart
  const carrierDistribution = CARRIERS.map(c => {
    const totalCarrierBilled = INVOICES.filter(inv => inv.carrierId === c.id).reduce((sum, inv) => sum + inv.totalBilledAmount, 0);
    return {
      name: c.name,
      value: parseFloat(totalCarrierBilled.toFixed(2))
    };
  });

  res.json({
    kpis: {
      totalBilled: parseFloat(totalBilled.toFixed(2)),
      totalRecoverable: parseFloat(totalRecoverable.toFixed(2)),
      auditCoveragePercent,
      activeExceptions: openExceptions,
      totalExceptions,
      slaCompliance: slaPercentage,
      totalAccrued: parseFloat(totalAccrued.toFixed(2)),
      accrualVariance: parseFloat((totalBilled - totalAccrued).toFixed(2)),
      unresolvedFindings: totalFindings - resolvedFindings,
      findingsCoverage: totalFindings,
      averageRiskScore: 78.4 // enterprise score
    },
    trendData,
    carrierDistribution
  });
});

// ==========================================
// FREIGHT INVOICES ENDPOINTS (CRUD & Filtering)
// ==========================================
app.get("/api/invoices", (req: Request, res: Response) => {
  const { carrier, vendor, plant, route, status, query, page, limit, exceptionOnly } = req.query;

  let filtered = [...INVOICES];

  if (carrier && carrier !== "All") {
    filtered = filtered.filter(inv => inv.carrierId === carrier || inv.carrierName === carrier);
  }
  if (plant && plant !== "All") {
    filtered = filtered.filter(inv => inv.plantId === plant || inv.plantName === plant);
  }
  if (route && route !== "All") {
    filtered = filtered.filter(inv => inv.routeId === route || `${inv.routeOrigin} ➔ ${inv.routeDestination}` === route);
  }
  if (status && status !== "All") {
    filtered = filtered.filter(inv => inv.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (exceptionOnly === "true") {
    filtered = filtered.filter(inv => inv.rateToleranceExceeded || inv.weightToleranceExceeded || inv.routeInflationPct > 10 || inv.isDuplicate || inv.fuelVariance > 25);
  }

  if (query) {
    const q = (query as string).toLowerCase();
    filtered = filtered.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.carrierName.toLowerCase().includes(q) ||
      inv.plantName.toLowerCase().includes(q) ||
      inv.lrNumber.toLowerCase().includes(q) ||
      inv.shipmentNumber.toLowerCase().includes(q)
    );
  }

  // Pagination support
  const pageNo = parseInt(page as string) || 1;
  const limitNo = parseInt(limit as string) || 15;
  const startIndex = (pageNo - 1) * limitNo;
  const endIndex = pageNo * limitNo;

  const paginatedResults = filtered.slice(startIndex, endIndex);

  res.json({
    data: paginatedResults,
    totalCount: filtered.length,
    page: pageNo,
    limit: limitNo,
    totalPages: Math.ceil(filtered.length / limitNo)
  });
});

app.get("/api/invoices/:id", (req: Request, res: Response) => {
  const invoice = INVOICES.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "Freight Invoice records not located." });
  }
  // Find linked exceptions
  const linkedExceptions = EXCEPTIONS.filter(e => e.invoiceId === invoice.id);
  res.json({
    ...invoice,
    exceptions: linkedExceptions
  });
});

app.put("/api/invoices/:id", (req: Request, res: Response) => {
  const invoiceIdx = INVOICES.findIndex(inv => inv.id === req.params.id);
  if (invoiceIdx === -1) {
    return res.status(404).json({ error: "Invoice record not found." });
  }

  const { status, remarks } = req.body;
  INVOICES[invoiceIdx].status = status;

  logAudit(req.body.updatedBy || "Auditor", `Invoice ${INVOICES[invoiceIdx].invoiceNumber} status set to ${status}`, "Workspace", `Administrative remarks applied: ${remarks || 'None'}`);
  res.json(INVOICES[invoiceIdx]);
});

// ==========================================
// EXCEPTIONS QUEUE & WORKFLOW (Module 22)
// ==========================================
app.get("/api/exceptions", (req: Request, res: Response) => {
  const { status, severity, priority, assignee } = req.query;
  
  let filtered = [...EXCEPTIONS];

  if (status && status !== "All") {
    filtered = filtered.filter(e => e.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (severity && severity !== "All") {
    filtered = filtered.filter(e => e.severity === severity);
  }
  if (priority && priority !== "All") {
    filtered = filtered.filter(e => e.priority === priority);
  }
  if (assignee && assignee !== "All") {
    filtered = filtered.filter(e => e.assignedToId === assignee || e.assignedToName === assignee);
  }

  res.json(filtered);
});

app.put("/api/exceptions/:id", (req: Request, res: Response) => {
  const excIdx = EXCEPTIONS.findIndex(e => e.id === req.params.id);
  if (excIdx === -1) {
    return res.status(404).json({ error: "Exception entity not found." });
  }

  const { status, priority, severity, assignedToId } = req.body;
  
  if (status) EXCEPTIONS[excIdx].status = status;
  if (priority) EXCEPTIONS[excIdx].priority = priority;
  if (severity) EXCEPTIONS[excIdx].severity = severity;
  
  if (assignedToId !== undefined) {
    if (assignedToId === null) {
      EXCEPTIONS[excIdx].assignedToId = null;
      EXCEPTIONS[excIdx].assignedToName = null;
    } else {
      const user = USERS.find(u => u.id === assignedToId);
      if (user) {
        EXCEPTIONS[excIdx].assignedToId = user.id;
        EXCEPTIONS[excIdx].assignedToName = user.name;
      }
    }
  }

  logAudit(req.body.updatedBy || "Auditor", `Exception ${req.params.id} reconfigured`, "Exception Queue", `Status: ${EXCEPTIONS[excIdx].status}, Assignee: ${EXCEPTIONS[excIdx].assignedToName || "Unassigned"}`);
  res.json(EXCEPTIONS[excIdx]);
});

app.post("/api/exceptions/:id/comments", (req: Request, res: Response) => {
  const exception = EXCEPTIONS.find(e => e.id === req.params.id);
  if (!exception) {
    return res.status(404).json({ error: "Exception reference not discovered." });
  }

  const { authorName, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Comment text body is required." });
  }

  const newComment: Comment = {
    id: `com-${Math.floor(Math.random() * 1000000)}`,
    exceptionId: exception.id,
    authorName: authorName || "Anonymous Auditor",
    text,
    createdAt: new Date().toISOString()
  };

  exception.comments.push(newComment);
  logAudit(newComment.authorName, `Added comment on Exception ${exception.id}`, "Exception Queue", text);
  res.json(newComment);
});

// ==========================================
// AUDIT FINDINGS ENDPOINTS (Module 24)
// ==========================================
app.get("/api/findings", (req: Request, res: Response) => {
  res.json(FINDINGS);
});

app.post("/api/findings", (req: Request, res: Response) => {
  const { title, observation, rootCause, impact, recommendation, riskRating, owner, authorName } = req.body;
  if (!title || !observation) {
    return res.status(400).json({ error: "Finding title and observation details are mandatory." });
  }

  const newFinding: Finding = {
    id: `fnd-${100 + FINDINGS.length + 1}`,
    title,
    observation,
    rootCause: rootCause || "Under Investigation",
    impact: parseFloat(impact) || 0.00,
    recommendation,
    riskRating: riskRating || "Medium",
    owner: owner || "Unassigned Operational Lead",
    status: "Open",
    createdAt: new Date().toISOString(),
    authorName: authorName || "Lead Auditor"
  };

  FINDINGS.push(newFinding);
  logAudit(newFinding.authorName, `Created Audit Finding: ${newFinding.title}`, "Audit Findings", `Monetary risk assessment: $${newFinding.impact}`);
  res.status(201).json(newFinding);
});

app.put("/api/findings/:id", (req: Request, res: Response) => {
  const fndIdx = FINDINGS.findIndex(f => f.id === req.params.id);
  if (fndIdx === -1) {
    return res.status(404).json({ error: "Audit finding not identified." });
  }

  const { title, observation, rootCause, impact, recommendation, riskRating, owner, status } = req.body;
  
  if (title) FINDINGS[fndIdx].title = title;
  if (observation) FINDINGS[fndIdx].observation = observation;
  if (rootCause) FINDINGS[fndIdx].rootCause = rootCause;
  if (impact !== undefined) FINDINGS[fndIdx].impact = parseFloat(impact);
  if (recommendation) FINDINGS[fndIdx].recommendation = recommendation;
  if (riskRating) FINDINGS[fndIdx].riskRating = riskRating;
  if (owner) FINDINGS[fndIdx].owner = owner;
  if (status) FINDINGS[fndIdx].status = status;

  logAudit(req.body.updatedBy || "Audit Lead", `Updated Finding: ${FINDINGS[fndIdx].title}`, "Audit Findings", `State: ${FINDINGS[fndIdx].status}`);
  res.json(FINDINGS[fndIdx]);
});

app.delete("/api/findings/:id", (req: Request, res: Response) => {
  const fndIdx = FINDINGS.findIndex(f => f.id === req.params.id);
  if (fndIdx === -1) {
    return res.status(404).json({ error: "Audit finding not found." });
  }

  const title = FINDINGS[fndIdx].title;
  FINDINGS.splice(fndIdx, 1);
  logAudit("Audit Administrator", `Deleted Audit Finding: ${title}`, "Audit Universe", `Finding reference ID ${req.params.id} permanently removed.`);
  res.json({ success: true, message: "Finding purged successfully." });
});

// ==========================================
// CAPA / REMEDIATION TRACKER (Module 25)
// ==========================================
app.get("/api/remediations", (req: Request, res: Response) => {
  res.json(REMEDIATIONS);
});

app.post("/api/remediations", (req: Request, res: Response) => {
  const { findingId, capaAction, owner, dueDate } = req.body;
  if (!findingId || !capaAction) {
    return res.status(400).json({ error: "Finding selection and CAPA Action outline are required." });
  }

  const finding = FINDINGS.find(f => f.id === findingId);
  const findingTitle = finding ? finding.title : "Linked Audit Objective";

  const newCapa: Remediation = {
    id: `capa-${100 + REMEDIATIONS.length + 1}`,
    findingId,
    findingTitle,
    capaAction,
    owner: owner || "Operation Specialist",
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    evidence: null,
    retestingStatus: "Pending",
    status: "Active",
    createdAt: new Date().toISOString().split('T')[0]
  };

  REMEDIATIONS.push(newCapa);
  logAudit(req.body.authorName || "Auditor", `Established CAPA Remediation Action for Finding: ${findingTitle}`, "Remediation Tracker", `Due date set: ${newCapa.dueDate}`);
  res.status(201).json(newCapa);
});

app.put("/api/remediations/:id", (req: Request, res: Response) => {
  const capaIdx = REMEDIATIONS.findIndex(r => r.id === req.params.id);
  if (capaIdx === -1) {
    return res.status(404).json({ error: "CAPA Remediation object not found." });
  }

  const { progress, retestingStatus, status, evidence, owner, dueDate } = req.body;
  
  if (progress !== undefined) REMEDIATIONS[capaIdx].progress = parseInt(progress);
  if (retestingStatus) REMEDIATIONS[capaIdx].retestingStatus = retestingStatus;
  if (status) REMEDIATIONS[capaIdx].status = status;
  if (evidence !== undefined) REMEDIATIONS[capaIdx].evidence = evidence;
  if (owner) REMEDIATIONS[capaIdx].owner = owner;
  if (dueDate) REMEDIATIONS[capaIdx].dueDate = dueDate;

  // Auto transition overall status if 100% progress
  if (REMEDIATIONS[capaIdx].progress === 100) {
    REMEDIATIONS[capaIdx].status = "Completed";
  }

  logAudit(req.body.updatedBy || "Owner Manager", `Remediation CAPA ${req.params.id} modified`, "Remediation Tracker", `Progress: ${REMEDIATIONS[capaIdx].progress}%, Retesting: ${REMEDIATIONS[capaIdx].retestingStatus}`);
  res.json(REMEDIATIONS[capaIdx]);
});

// ==========================================
// RULES LIBRARY ENDPOINTS (Module 19)
// ==========================================
app.get("/api/rules", (req: Request, res: Response) => {
  res.json(RULES);
});

app.put("/api/rules/:id", (req: Request, res: Response) => {
  const ruleIdx = RULES.findIndex(r => r.id === req.params.id);
  if (ruleIdx === -1) {
    return res.status(404).json({ error: "Compliance rule not located." });
  }

  const { isEnabled, threshold, severity, sqlRule } = req.body;
  
  if (isEnabled !== undefined) RULES[ruleIdx].isEnabled = isEnabled;
  if (threshold !== undefined) RULES[ruleIdx].threshold = parseFloat(threshold);
  if (severity) RULES[ruleIdx].severity = severity;
  if (sqlRule) RULES[ruleIdx].sqlRule = sqlRule;

  logAudit(req.body.updatedBy || "System Administrator", `Compliance Rule ${RULES[ruleIdx].name} updated`, "Rule Library", `Status: ${RULES[ruleIdx].isEnabled ? "Enabled" : "Disabled"}, Tolerance Limit: ${RULES[ruleIdx].threshold}%`);
  res.json(RULES[ruleIdx]);
});

// ==========================================
// RISK & CONTROL MATRIX ENDPOINTS (Module 18)
// ==========================================
app.get("/api/risk-controls", (req: Request, res: Response) => {
  res.json(RISK_CONTROLS);
});

app.post("/api/risk-controls", (req: Request, res: Response) => {
  const { riskCode, riskName, controlName, assertion, owner, frequency, testProcedure } = req.body;
  if (!riskCode || !riskName) {
    return res.status(400).json({ error: "Risk code and name are mandatory." });
  }

  const newRc: RiskControl = {
    id: `rc-gen-${Math.floor(Math.random() * 10000)}`,
    riskCode,
    riskName,
    controlName: controlName || "Assigned Control Standard",
    assertion: assertion || "Accuracy & Completeness",
    owner: owner || "Internal Audit",
    frequency: frequency || "Monthly",
    testProcedure: testProcedure || "Reconcile logs."
  };

  RISK_CONTROLS.push(newRc);
  logAudit(req.body.authorName || "Lead Auditor", `Added Risk Control Objective: ${newRc.riskCode}`, "Risk & Control Matrix", newRc.riskName);
  res.status(201).json(newRc);
});

app.put("/api/risk-controls/:id", (req: Request, res: Response) => {
  const rcIdx = RISK_CONTROLS.findIndex(r => r.id === req.params.id);
  if (rcIdx === -1) {
    return res.status(404).json({ error: "Risk Control matrix objective not found." });
  }

  const { riskName, controlName, assertion, owner, frequency, testProcedure } = req.body;
  if (riskName) RISK_CONTROLS[rcIdx].riskName = riskName;
  if (controlName) RISK_CONTROLS[rcIdx].controlName = controlName;
  if (assertion) RISK_CONTROLS[rcIdx].assertion = assertion;
  if (owner) RISK_CONTROLS[rcIdx].owner = owner;
  if (frequency) RISK_CONTROLS[rcIdx].frequency = frequency;
  if (testProcedure) RISK_CONTROLS[rcIdx].testProcedure = testProcedure;

  logAudit(req.body.updatedBy || "Auditor", `Modified Risk Control Matrix: ${RISK_CONTROLS[rcIdx].riskCode}`, "Risk & Control Matrix", "Controls adjusted");
  res.json(RISK_CONTROLS[rcIdx]);
});

app.delete("/api/risk-controls/:id", (req: Request, res: Response) => {
  const rcIdx = RISK_CONTROLS.findIndex(r => r.id === req.params.id);
  if (rcIdx === -1) {
    return res.status(404).json({ error: "Risk Control not found." });
  }
  const code = RISK_CONTROLS[rcIdx].riskCode;
  RISK_CONTROLS.splice(rcIdx, 1);
  logAudit("System Administrator", `Removed Risk Control Map: ${code}`, "Risk & Control Matrix", `Matrix item deleted`);
  res.json({ success: true });
});

// ==========================================
// SAMPLING BUILDER ENDPOINTS (Module 21)
// ==========================================
app.get("/api/sampling-configs", (req: Request, res: Response) => {
  res.json(SAMPLING_CONFIGS);
});

app.post("/api/sampling-configs", (req: Request, res: Response) => {
  const { method, sampleSize, confidenceLevel, materialityLimit } = req.body;
  
  const newConfig: SamplingConfig = {
    id: `sc-gen-${Math.floor(Math.random() * 10000)}`,
    method: method || "Random",
    sampleSize: parseInt(sampleSize) || 25,
    confidenceLevel: parseFloat(confidenceLevel) || 95.0,
    materialityLimit: parseFloat(materialityLimit) || 5000.0,
    createdAt: new Date().toISOString()
  };

  SAMPLING_CONFIGS.unshift(newConfig);
  logAudit(req.body.createdBy || "Auditor", `Re-ran Sampling Selector Engine`, "Sampling Builder", `Generated statistical sample size of ${newConfig.sampleSize} using ${newConfig.method} Methodology.`);
  
  // Pick invoices matching the sampling criteria to return
  let sourcePool = [...INVOICES];
  if (newConfig.method === "RiskBased") {
    // prioritize high billing or disputed/tolerance exceeded
    sourcePool = sourcePool.sort((a, b) => b.totalBilledAmount - a.totalBilledAmount);
  } else if (newConfig.method === "MonetaryUnit") {
    sourcePool = sourcePool.filter(inv => inv.totalBilledAmount >= newConfig.materialityLimit);
  }

  const selectedSamples = sourcePool.slice(0, newConfig.sampleSize);
  res.json({
    config: newConfig,
    samples: selectedSamples
  });
});

// ==========================================
// WORKING PAPERS & EVIDENCE (Module 23)
// ==========================================
app.get("/api/working-papers", (req: Request, res: Response) => {
  res.json(WORKING_PAPERS);
});

app.post("/api/working-papers", (req: Request, res: Response) => {
  const { fileName, fileType, fileSize, uploadedBy } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "File name is required to log digital evidence." });
  }

  const newWp: WorkingPaper = {
    id: `wp-gen-${Math.floor(Math.random() * 10000)}`,
    fileName,
    fileSize: fileSize || "1.2 MB",
    fileType: fileType || "PDF",
    uploadedBy: uploadedBy || "Sarah Jenkins",
    tickMarks: [],
    reviewerSignoff: false,
    reviewerName: null,
    createdAt: new Date().toISOString().split('T')[0]
  };

  WORKING_PAPERS.unshift(newWp);
  logAudit(newWp.uploadedBy, `Uploaded Audit Evidence Working Paper: ${newWp.fileName}`, "Evidence Workspace", `File size: ${newWp.fileSize}`);
  res.status(201).json(newWp);
});

app.put("/api/working-papers/:id/signoff", (req: Request, res: Response) => {
  const wpIdx = WORKING_PAPERS.findIndex(w => w.id === req.params.id);
  if (wpIdx === -1) {
    return res.status(404).json({ error: "Working paper not found." });
  }

  const { reviewerName, signoff, tickMarks } = req.body;
  
  if (signoff !== undefined) {
    WORKING_PAPERS[wpIdx].reviewerSignoff = signoff;
    WORKING_PAPERS[wpIdx].reviewerName = signoff ? (reviewerName || "Sarah Jenkins") : null;
  }
  if (tickMarks) {
    WORKING_PAPERS[wpIdx].tickMarks = tickMarks;
  }

  logAudit(reviewerName || "Lead Auditor", `Reviewed and signed working paper ${WORKING_PAPERS[wpIdx].fileName}`, "Evidence Workspace", `Sign-off state: ${WORKING_PAPERS[wpIdx].reviewerSignoff}`);
  res.json(WORKING_PAPERS[wpIdx]);
});

// ==========================================
// CONFIGURATIONS, DATA SOURCES & CORE METADATA
// ==========================================
app.get("/api/carriers", (req: Request, res: Response) => {
  res.json(CARRIERS);
});

app.get("/api/plants", (req: Request, res: Response) => {
  res.json(PLANTS);
});

app.get("/api/routes", (req: Request, res: Response) => {
  res.json(ROUTES);
});

app.get("/api/contracts", (req: Request, res: Response) => {
  res.json(CONTRACTS);
});

app.get("/api/audit-logs", (req: Request, res: Response) => {
  res.json(AUDIT_LOGS);
});

// ==========================================
// STATIC FRONTEND ROUTING & DEVELOPMENT SERVERS
// ==========================================
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IAOS Enterprise Auditor Backend] running on http://0.0.0.0:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error("FATAL: Failed to launch Express + Vite Server middleware", err);
});
