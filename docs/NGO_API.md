# NGO Donation API Integration Guide

This document outlines how the public NGO website should integrate with the standalone Donation Management System.

## Architectural Boundary

The standalone Donation Management System is the **authoritative source** for all financial verifications, OCR extractions, and bank reconciliations. 
The NGO website must act solely as the donor-facing client. It should initiate donations through this API.

### 1. Create a Donation (Public API)

**Endpoint:** `POST /api/public/donations`

**Authentication:** 
- Configurable via `NGO_API_KEY` (Bearer Token) if used server-to-server.
- CORS restricted via `NGO_WEBSITE_ORIGIN`.

**Headers:**
```http
Content-Type: application/json
Idempotency-Key: <unique-uuid-per-transaction-attempt>
Authorization: Bearer YOUR_API_KEY (optional)
```

**Request Body Schema:**
```json
{
  "donorName": "string (Required)",
  "donorEmail": "string (Optional)",
  "donorPhone": "string (Optional)",
  "amount": "number (Required, positive)",
  "currency": "INR",
  "paymentMethod": "UPI | BANK_TRANSFER | CREDIT_CARD | DEBIT_CARD | PAYU",
  "donorPan": "string (Optional, max 10)",
  "donorAddress": "string (Optional)",
  "source": "NGO_WEBSITE",
  "externalReference": "string (Optional, your internal system ID)"
}
```

**Safe JSON Response (Success):**
```json
{
  "success": true,
  "donationId": "uuid",
  "reference": "your-external-reference-or-uuid",
  "status": "PENDING",
  "paymentMethod": "UPI",
  "amount": 5000
}
```

**Safe JSON Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid amount"
  }
}
```

### 2. Idempotency

You must include an `Idempotency-Key` header (e.g., a UUID4 generated at checkout). If a network timeout occurs and you retry the exact same request, the system will gracefully return the original `donationId` without creating a duplicate record in the backend.

### 3. Payment Initiation (PayU)

If you are using PayU:
1. Call `POST /api/public/donations` to generate the `donationId`.
2. Do not attempt to generate PayU hashes on the NGO frontend.
3. Redirect the user to the Donation System's secure PayU checkout endpoint (e.g., `/api/payu/initiate?donationId=...`) or trigger the existing Phase 8 `submitDonationAction` equivalent if building a unified server flow. 
4. The PayU server-to-server Webhook is the only trusted source for verifying the transaction. Browser redirects are explicitly ignored for verification.

### 4. Uploading Screenshots

If a donor uploads a screenshot of a manual UPI/Bank transfer:
Use the standard multipart upload flow. Screenshots are safely stored outside the `public` directory, randomized, and processed via the OCR pipeline securely.

### Security Notes
- The public API is strictly additive.
- The client cannot force a donation into a `VERIFIED` state.
- Sensitive fields (PAN, etc.) are safely ingested and never returned in API responses.
