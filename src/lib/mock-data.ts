export const MOCK_DONATIONS = [
  { id: "DON-000001", name: "Rahul Kumar", amount: 2500, date: "2026-10-01", time: "14:30", status: "PENDING", method: "UPI", utr: "UTR-DEMO123", ocrStatus: "EXTRACTED", bankMatch: "NOT CHECKED", pgMatch: "NOT CHECKED", riskStatus: "LOW" },
  { id: "DON-000002", name: "Neha Sharma", amount: 5000, date: "2026-10-02", time: "09:15", status: "VERIFIED", method: "BANK_TRANSFER", utr: "UTR-DEMO456", ocrStatus: "MATCHED", bankMatch: "MATCHED", pgMatch: "N/A", riskStatus: "LOW" },
  { id: "DON-000003", name: "Amit Singh", amount: 1000, date: "2026-10-02", time: "11:45", status: "REVIEW_REQUIRED", method: "PAYTM", utr: "UTR-DEMO789", ocrStatus: "MISMATCH", bankMatch: "NOT FOUND", pgMatch: "NOT CHECKED", riskStatus: "HIGH" },
  { id: "DON-000004", name: "Priya Desai", amount: 10000, date: "2026-09-28", time: "16:20", status: "REJECTED", method: "UPI", utr: "UTR-DEMO999", ocrStatus: "FAILED", bankMatch: "NOT FOUND", pgMatch: "NOT CHECKED", riskStatus: "HIGH" },
  { id: "DON-000005", name: "Vikram Patel", amount: 2500, date: "2026-09-30", time: "10:05", status: "DUPLICATE", method: "UPI", utr: "UTR-DEMO123", ocrStatus: "EXTRACTED", bankMatch: "MATCHED", pgMatch: "NOT CHECKED", riskStatus: "MEDIUM" },
];

export const MOCK_STATS = {
  totalDonations: 15430,
  verified: 12500,
  pending: 12,
  reviewRequired: 4,
  rejected: 7,
  duplicate: 2,
  totalDonationAmount: 450000,
  verifiedAmount: 380000,
};

export const MOCK_AUDIT = [
  { id: 1, timestamp: "2026-10-02 14:00:12", admin: "admin@ngo.org", action: "VERIFIED_DONATION", entity: "Donation", entityId: "DON-000002", status: "SUCCESS" },
  { id: 2, timestamp: "2026-10-02 13:45:00", admin: "SYSTEM", action: "OCR_EXTRACTION", entity: "Donation", entityId: "DON-000001", status: "SUCCESS" },
  { id: 3, timestamp: "2026-10-02 11:50:33", admin: "reviewer@ngo.org", action: "FLAGGED_REVIEW", entity: "Donation", entityId: "DON-000003", status: "SUCCESS" },
];

export const MOCK_RECONCILIATION = [
  { id: "REC-01", file: "HDFC_Stmt_Oct.xlsx", bank: "HDFC", account: "****1234", importedAt: "2026-10-02 09:00", rows: 145, matched: 140, unmatched: 5, status: "COMPLETED" },
  { id: "REC-02", file: "SBI_Stmt_Oct.csv", bank: "SBI", account: "****9876", importedAt: "2026-10-01 10:30", rows: 50, matched: 20, unmatched: 30, status: "NEEDS_REVIEW" },
];
