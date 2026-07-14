export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Carrier {
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

export interface Plant {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  gpsDistanceKm: number;
  billedDistanceKm: number;
  optimalRoute: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  carrierId: string;
  baseRate: number;
  tolerancePct: number;
  fuelFormula: string;
  validFrom: string;
  validTo: string;
}

export interface Comment {
  id: string;
  exceptionId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Exception {
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

export interface FreightInvoice {
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

  // 13. Damage & Claims
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

export interface Finding {
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

export interface Remediation {
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

export interface RiskControl {
  id: string;
  riskCode: string;
  riskName: string;
  controlName: string;
  assertion: string;
  owner: string;
  frequency: string;
  testProcedure: string;
}

export interface Rule {
  id: string;
  name: string;
  category: string;
  threshold: number;
  severity: "High" | "Medium" | "Low";
  sqlRule: string;
  isEnabled: boolean;
}

export interface SamplingConfig {
  id: string;
  method: "Random" | "MonetaryUnit" | "RiskBased" | "Custom";
  sampleSize: number;
  confidenceLevel: number;
  materialityLimit: number;
  createdAt: string;
}

export interface WorkingPaper {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "PDF" | "XLSX" | "DOCX" | "PNG";
  uploadedBy: string;
  tickMarks: string[];
  reviewerSignoff: boolean;
  reviewerName: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export interface DashboardStats {
  kpis: {
    totalBilled: number;
    totalRecoverable: number;
    auditCoveragePercent: number;
    activeExceptions: number;
    totalExceptions: number;
    slaCompliance: number;
    totalAccrued: number;
    accrualVariance: number;
    unresolvedFindings: number;
    findingsCoverage: number;
    averageRiskScore: number;
  };
  trendData: Array<{
    month: string;
    billed: number;
    recovered: number;
    exceptions: number;
  }>;
  carrierDistribution: Array<{
    name: string;
    value: number;
  }>;
}
