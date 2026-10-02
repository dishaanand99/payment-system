export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VERIFIER' | 'VIEWER';

export function canViewDashboard(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN', 'VERIFIER', 'VIEWER'].includes(role);
}

export function canViewDonation(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN', 'VERIFIER', 'VIEWER'].includes(role);
}

export function canVerifyDonation(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN', 'VERIFIER'].includes(role);
}

export function canRejectDonation(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN', 'VERIFIER'].includes(role);
}

export function canImportBankStatement(role: Role) {
  return ['SUPER_ADMIN'].includes(role);
}

export function canExportReports(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role);
}

export function canManageUsers(role: Role) {
  return ['SUPER_ADMIN'].includes(role);
}

export function canViewAuditLogs(role: Role) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role);
}

export function canManageSettings(role: Role) {
  return ['SUPER_ADMIN'].includes(role);
}
