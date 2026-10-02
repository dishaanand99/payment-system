-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VERIFIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "utr" TEXT,
    "receiptNumber" TEXT,
    "donatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    CONSTRAINT "Donation_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donationId" TEXT NOT NULL,
    "utr" TEXT,
    "amount" REAL NOT NULL,
    "transactionDate" DATETIME,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "bankTransactionId" TEXT,
    "gatewayTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentTransaction_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentTransaction_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentTransaction_gatewayTransactionId_fkey" FOREIGN KEY ("gatewayTransactionId") REFERENCES "PaymentGatewayTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OCRResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donationId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "extractedUtr" TEXT,
    "extractedAmount" REAL,
    "extractedDate" DATETIME,
    "extractedTime" TEXT,
    "extractedDonorName" TEXT,
    "extractedPaymentMethod" TEXT,
    "extractedBankName" TEXT,
    "extractedPaymentStatus" TEXT,
    "rawText" TEXT,
    "confidenceScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OCRResult_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankStatementImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "importDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankStatementImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountIdentifier" TEXT,
    "date" DATETIME NOT NULL,
    "transactionTime" DATETIME,
    "description" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "credit" REAL,
    "debit" REAL,
    "balance" REAL,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BankTransaction_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BankStatementImport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentGatewayTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerTransactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "rawResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VerificationAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donationId" TEXT NOT NULL,
    "verifierId" TEXT,
    "source" TEXT NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationAttempt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationAttempt_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminNote_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_utr_key" ON "Donation"("utr");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_receiptNumber_key" ON "Donation"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_utr_key" ON "PaymentTransaction"("utr");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_bankTransactionId_key" ON "PaymentTransaction"("bankTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_gatewayTransactionId_key" ON "PaymentTransaction"("gatewayTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_date_description_credit_balance_key" ON "BankTransaction"("date", "description", "credit", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayTransaction_providerTransactionId_key" ON "PaymentGatewayTransaction"("providerTransactionId");
