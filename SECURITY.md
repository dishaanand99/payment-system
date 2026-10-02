# Security Architecture and Operational Guidelines

This document outlines the trust boundaries, security architecture, and operational guidelines for the NGO Donation Management & Payment Verification System.

## 1. Authentication & RBAC
- **Authentication**: JWT-based session cookies securely signed with a server-side `JWT_SECRET`. Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` (in production).
- **RBAC**: Enforced via server-side session checks in all Server Actions and API Routes. Role hierarchy:
  - `SUPER_ADMIN`: Full access + User management.
  - `ADMIN`: Full access to donations, verification, and reports.
  - `VERIFIER`: Restricted to verification tasks and viewing.
  - `VIEWER`: Read-only dashboard access.
- **Client Trust**: The client (browser) is entirely untrusted. Role checks on the frontend are purely for UI/UX. The backend always revalidates the session role.

## 2. File Uploads & Private Storage
- **Donation Screenshots**: Uploaded to a protected local `storage/uploads/donations` directory outside of the `public/` folder.
- **Path Traversal Protection**: Filenames are forcefully renamed to `DON-<UUID>.<ext>`. Path variables passed from the client are completely ignored during storage.
- **Image Validation**: Only `image/jpeg`, `image/png`, and `image/webp` are permitted. Files are validated via Magic Byte (Header) inspection in `src/lib/services/storage.ts`, preventing malicious extensions/payloads.
- **Bank Imports**: CSV/XLSX uploads are processed entirely in memory via `Buffer`. They are never written to the disk, nullifying any Local File Inclusion (LFI) or Path Traversal risks.

## 3. Trust Boundaries & Verification Engine
### OCR is NOT Verification
OCR extraction (`Tesseract.js`) is an **evidence gathering tool**, not a verification source. Even if OCR successfully reads a UTR matching a donation, the system will **NOT** automatically mark it as `VERIFIED`.

### What Constitutes "Trusted" Data?
1. **PayU Server-to-Server (S2S) Webhook**: Direct, cryptographically signed HTTP callback from the payment gateway.
2. **Bank Statement Import**: Direct CSV/XLSX uploaded by an `ADMIN` or `SUPER_ADMIN`.
3. **Manual Verification**: Authorized `ADMIN` action.

### The Verification Rule
Only Trusted Data can transition a donation to `VERIFIED`. A browser redirect (client-side PayU return) is explicitly blocked from verifying a transaction, as it can be easily spoofed.

## 4. PayU Integration Security
- Webhooks enforce **Merchant Key Validation**. A callback with a missing or mismatched merchant key is instantly rejected.
- **Reverse Hash Integrity**: `hash.ts` strictly validates the PayU reverse hash formula (`salt|status||||||...|udf1|email|firstname|productinfo|amount|txnid|key`), including the `additionalCharges` prefix if applicable.
- **Idempotency**: Webhooks track `mihpayid`. Replayed webhooks are processed safely without duplicating financial records.
- **Amount Verification**: Webhook amounts are validated down to the cent against the core `Donation` table amount.

## 5. Export Security & Accounting Integrity
- **Formula Injection Protection**: Any exported field (CSV/XLSX) beginning with `=`, `+`, `-`, or `@` is prefixed with a single quote `'` to neutralize dangerous executable formulas.
- **Financial Aggregation**: The dashboard and Excel exports query directly from the authoritative `Donation` table. Supporting records (like `BankTransaction` or `PaymentTransaction`) are explicitly treated as metadata. A single donation with multiple payment confirmations will *never* be counted twice.
- **Auditing**: All data exports trigger an `AuditLog` preserving the actor, time, and applied filters, but avoiding massive JSON bloat by not storing the raw exported rows.

## 6. Secrets & Environment Variables
- Ensure that `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` are never prefixed with `NEXT_PUBLIC_`.
- Do not log these secrets in `console.log` or error responses.
- Error handling in Webhooks and APIs explicitly strips internal stack traces from HTTP responses to prevent information leakage.

## 7. Production Checklist
Before deploying to production, confirm the following:
- [ ] `NODE_ENV="production"`
- [ ] Ensure `JWT_SECRET` is strong, randomly generated, and stored securely.
- [ ] Ensure `PAYU_ENVIRONMENT="PRODUCTION"`.
- [ ] Ensure proper HTTPS (TLS) termination at the reverse proxy (e.g., Nginx/Cloudflare).
- [ ] Verify `storage/uploads` has appropriate file system permissions (accessible only to the Node process).
- [ ] Implement database backups for `dev.db` (or migrate to Postgres/MySQL for scale).
- [ ] Do not expose `.env` or `dev.db` files via the public web server.
