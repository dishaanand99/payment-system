import prisma from '@/lib/prisma';
import { NormalizedBankTransaction, ImportPreview } from './types';
import { VerificationEngine } from '../verification/service';
import { VERIFICATION_RULES } from '../verification/rules';
import { NotificationService } from '../notifications';

export class BankImportService {
  
  async generatePreview(filename: string, rows: NormalizedBankTransaction[]): Promise<ImportPreview> {
    let validRows = 0;
    let invalidRows = 0;
    let creditCount = 0;
    let debitCount = 0;
    let duplicateCount = 0;
    let potentialMatchesCount = 0;

    const refs = rows.map(r => r.referenceNumber).filter(Boolean) as string[];
    const existingBankTxs = refs.length ? await prisma.bankTransaction.findMany({
       where: { referenceNumber: { in: refs } }
    }) : [];
    const existingBankRefs = new Set(existingBankTxs.map(tx => tx.referenceNumber));

    const existingDonations = refs.length ? await prisma.donation.findMany({
       where: { utr: { in: refs } }
    }) : [];
    const existingDonationRefs = new Set(existingDonations.map(d => d.utr));

    for (const row of rows) {
      if (row.isValid) {
        validRows++;
        if (row.isCredit) {
          creditCount++;
          if (row.referenceNumber && existingDonationRefs.has(row.referenceNumber)) {
             potentialMatchesCount++;
          }
        } else {
          debitCount++;
        }
        
        if (row.referenceNumber && existingBankRefs.has(row.referenceNumber)) {
           duplicateCount++;
        }
      } else {
        invalidRows++;
      }
    }

    return {
      filename,
      totalRows: rows.length,
      validRows,
      invalidRows,
      creditCount,
      debitCount,
      duplicateCount,
      potentialMatchesCount,
      rows,
    };
  }

  async confirmImport(adminId: string, filename: string, rows: NormalizedBankTransaction[]) {
    await prisma.auditLog.create({
       data: {
         userId: adminId,
         action: 'BANK_STATEMENT_IMPORT_STARTED',
         entityType: 'BankStatementImport',
         entityId: 'N/A',
         newValues: JSON.stringify({ filename, rows: rows.length }),
       }
    });

    const statementImport = await prisma.bankStatementImport.create({
      data: {
        filename,
        uploadedById: adminId,
        status: 'PROCESSING',
        totalRows: rows.length,
        processedRows: 0
      }
    });

    let successCount = 0;
    let failCount = 0;
    let dupCount = 0;

    const engine = new VerificationEngine();

    for (const row of rows) {
      if (!row.isValid) {
        failCount++;
        continue;
      }

      const dup = await prisma.bankTransaction.findFirst({
         where: {
            date: row.date || undefined,
            credit: row.credit || undefined,
            debit: row.debit || undefined,
            referenceNumber: row.referenceNumber || undefined,
         }
      });

      if (dup) {
         dupCount++;
         await prisma.auditLog.create({
           data: {
             userId: adminId,
             action: 'BANK_TRANSACTION_DUPLICATE',
             entityType: 'BankTransaction',
             entityId: dup.id,
             newValues: JSON.stringify({ reference: row.referenceNumber }),
           }
         });
         continue;
      }

      const bankTx = await prisma.bankTransaction.create({
         data: {
            importId: statementImport.id,
            date: row.date!,
            description: row.description,
            referenceNumber: row.referenceNumber,
            credit: row.credit,
            debit: row.debit,
            balance: row.balance,
            isReconciled: false
         }
      });

      successCount++;
      
      await prisma.auditLog.create({
         data: {
             userId: adminId,
             action: 'BANK_TRANSACTION_IMPORTED',
             entityType: 'BankTransaction',
             entityId: bankTx.id,
             newValues: JSON.stringify({ reference: row.referenceNumber, credit: row.credit }),
         }
      });

      if (row.isCredit && row.credit) {
         let matchedDonationId: string | null = null;
         
         if (row.referenceNumber) {
            const candidates = await prisma.donation.findMany({
               where: { utr: row.referenceNumber }
            });
            if (candidates.length === 1) {
               matchedDonationId = candidates[0].id;
            }
         }

         if (!matchedDonationId && row.credit && row.date) {
            const minDate = new Date(row.date);
            minDate.setDate(minDate.getDate() - VERIFICATION_RULES.DATE_TOLERANCE_DAYS);
            const maxDate = new Date(row.date);
            maxDate.setDate(maxDate.getDate() + VERIFICATION_RULES.DATE_TOLERANCE_DAYS);

            const candidates = await prisma.donation.findMany({
               where: {
                  amount: row.credit,
                  donatedAt: { gte: minDate, lte: maxDate }
               }
            });
            
            if (candidates.length === 1) {
               matchedDonationId = candidates[0].id;
            }
         }

         if (matchedDonationId) {
            await prisma.auditLog.create({
                 data: {
                     userId: adminId,
                     action: 'RECONCILIATION_STARTED',
                     entityType: 'BankTransaction',
                     entityId: bankTx.id,
                     newValues: JSON.stringify({ donationId: matchedDonationId }),
                 }
            });

            await prisma.paymentTransaction.create({
               data: {
                  donationId: matchedDonationId,
                  bankTransactionId: bankTx.id,
                  utr: row.referenceNumber,
                  amount: row.credit,
                  transactionDate: row.date,
                  status: 'SUCCESS',
                  source: 'BANK_STATEMENT'
               }
            });
            
            await prisma.bankTransaction.update({
               where: { id: bankTx.id },
               data: { isReconciled: true }
            });

            await engine.runVerification(matchedDonationId, adminId);
            
            await prisma.auditLog.create({
                 data: {
                     userId: adminId,
                     action: 'RECONCILIATION_COMPLETED',
                     entityType: 'Donation',
                     entityId: matchedDonationId,
                 }
            });
         } else {
            const notifService = new NotificationService();
            await notifService.triggerBankUnmatched(bankTx.id, row.credit, row.date!, row.referenceNumber || null, null);
         }
      }
    }

    await prisma.bankStatementImport.update({
      where: { id: statementImport.id },
      data: {
        status: 'COMPLETED',
        processedRows: successCount
      }
    });

    await prisma.auditLog.create({
       data: {
         userId: adminId,
         action: 'BANK_STATEMENT_IMPORT_COMPLETED',
         entityType: 'BankStatementImport',
         entityId: statementImport.id,
         newValues: JSON.stringify({ successCount, failCount, dupCount }),
       }
    });

    return { statementImportId: statementImport.id, successCount, failCount, dupCount };
  }
}
