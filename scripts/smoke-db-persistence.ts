import 'dotenv/config';
import { createHash } from 'node:crypto';
import { getPrismaClient } from '@/lib/db';
import { addQuoteActivity, createQuote, getQuoteById, updateQuote, updateQuoteStatus } from '@/lib/quotes';

function makeRunTag() {
  return createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest('hex').slice(0, 10);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for DB smoke testing.');
  }

  const prisma = getPrismaClient();
  const runTag = makeRunTag();
  const customerName = `Smoke Test Roofing ${runTag}`;

  await prisma.$connect();

  let createdId: string | undefined;

  try {
    const created = await createQuote({
      customerName,
      contactName: 'DB Pat Tester',
      phone: '555-0101',
      email: 'db-pat@example.com',
      jobAddress: `500 ${runTag} Database Ave`,
      estimateAmount: 22222,
      dateSent: '2026-04-01',
      notes: `DB smoke test ${runTag}`,
    });

    createdId = created.id;

    const afterCreate = await getQuoteById(created.id);
    if (!afterCreate) throw new Error('Created DB quote could not be read back.');
    if (afterCreate.activities.length !== 1) throw new Error(`Expected 1 activity after DB create, got ${afterCreate.activities.length}`);

    await updateQuote(created.id, {
      customerName: `${customerName} Updated`,
      contactName: 'DB Pat Tester',
      phone: '555-0101',
      email: 'db-pat@example.com',
      jobAddress: `501 ${runTag} Database Ave`,
      estimateAmount: 33333,
      dateSent: '2026-04-02',
      notes: `DB smoke update ${runTag}`,
      status: 'waiting',
    });

    const afterUpdate = await getQuoteById(created.id);
    if (!afterUpdate) throw new Error('Updated DB quote could not be read back.');
    if (afterUpdate.customerName !== `${customerName} Updated`) throw new Error('DB quote update did not persist customer name.');
    if (afterUpdate.activities.length !== 2) throw new Error(`Expected 2 activities after DB update, got ${afterUpdate.activities.length}`);

    await addQuoteActivity(created.id, {
      type: 'call',
      summary: `DB smoke touch ${runTag}`,
      nextFollowUpDate: '2026-04-05',
    });

    const afterActivity = await getQuoteById(created.id);
    if (!afterActivity) throw new Error('DB quote missing after activity append.');
    if (afterActivity.activities.length !== 3) throw new Error(`Expected 3 activities after DB touch, got ${afterActivity.activities.length}`);
    if (afterActivity.status !== 'waiting') throw new Error(`Expected status to remain waiting, got ${afterActivity.status}`);

    await updateQuoteStatus(created.id, {
      status: 'won',
    });

    const afterStatus = await getQuoteById(created.id);
    if (!afterStatus) throw new Error('DB quote missing after status update.');
    if (afterStatus.status !== 'won') throw new Error(`Expected won status, got ${afterStatus.status}`);
    if (afterStatus.activities.length !== 4) throw new Error(`Expected 4 activities after DB status update, got ${afterStatus.activities.length}`);

    console.log('DB smoke test passed:', {
      id: created.id,
      activities: afterStatus.activities.length,
      status: afterStatus.status,
    });
  } finally {
    if (createdId) {
      await prisma.activity.deleteMany({ where: { quoteId: createdId } });
      await prisma.quote.deleteMany({ where: { id: createdId } });
    }

    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
