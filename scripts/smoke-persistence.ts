import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { addQuoteActivity, createQuote, getQuoteById, updateQuote, updateQuoteStatus } from '@/lib/quotes';

const repoRoot = process.cwd();
const dataPath = path.join(repoRoot, 'data', 'quotes.json');
const backupPath = path.join(repoRoot, 'data', 'quotes.smoke-backup.json');

async function main() {
  if (process.env.DATABASE_URL) {
    throw new Error('Smoke test is intended for file mode only. Unset DATABASE_URL before running it.');
  }

  await fs.copyFile(dataPath, backupPath);

  try {
    const created = await createQuote({
      customerName: 'Smoke Test Roofing',
      contactName: 'Pat Tester',
      phone: '555-0100',
      email: 'pat@example.com',
      jobAddress: '123 Test Lane',
      estimateAmount: 12345,
      dateSent: '2026-04-01',
      notes: 'Created by smoke test.',
    });

    if (!created.id.startsWith('QC-')) {
      throw new Error(`Expected QC- id, got ${created.id}`);
    }

    const afterCreate = await getQuoteById(created.id);
    if (!afterCreate) throw new Error('Created quote could not be read back.');
    if (afterCreate.activities.length !== 1) throw new Error(`Expected 1 activity after create, got ${afterCreate.activities.length}`);

    await updateQuote(created.id, {
      customerName: 'Smoke Test Roofing Updated',
      contactName: 'Pat Tester',
      phone: '555-0100',
      email: 'pat@example.com',
      jobAddress: '456 Updated Ave',
      estimateAmount: 15000,
      dateSent: '2026-04-02',
      notes: 'Updated by smoke test.',
      status: 'waiting',
    });

    const afterUpdate = await getQuoteById(created.id);
    if (!afterUpdate) throw new Error('Updated quote could not be read back.');
    if (afterUpdate.customerName !== 'Smoke Test Roofing Updated') throw new Error('Quote update did not persist customer name.');
    if (afterUpdate.activities.length !== 2) throw new Error(`Expected 2 activities after update, got ${afterUpdate.activities.length}`);

    await addQuoteActivity(created.id, {
      type: 'call',
      summary: 'Called customer during smoke test.',
      nextFollowUpDate: '2026-04-05',
    });

    const afterActivity = await getQuoteById(created.id);
    if (!afterActivity) throw new Error('Quote missing after activity append.');
    if (afterActivity.activities.length !== 3) throw new Error(`Expected 3 activities after touch, got ${afterActivity.activities.length}`);
    if (afterActivity.status !== 'waiting') throw new Error(`Expected status to remain waiting, got ${afterActivity.status}`);

    await updateQuoteStatus(created.id, {
      status: 'won',
    });

    const afterStatus = await getQuoteById(created.id);
    if (!afterStatus) throw new Error('Quote missing after status update.');
    if (afterStatus.status !== 'won') throw new Error(`Expected won status, got ${afterStatus.status}`);
    if (afterStatus.activities.length !== 4) throw new Error(`Expected 4 activities after status update, got ${afterStatus.activities.length}`);

    console.log('Smoke test passed:', {
      id: created.id,
      activities: afterStatus.activities.length,
      status: afterStatus.status,
    });
  } finally {
    await fs.copyFile(backupPath, dataPath);
    await fs.unlink(backupPath).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
