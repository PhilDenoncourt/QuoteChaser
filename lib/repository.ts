import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { dbEnabled, getPrismaClient } from '@/lib/db';
import type { Activity, ActivityType, Quote, QuoteStatus } from '@/lib/domain';

const quotesFilePath = path.join(process.cwd(), 'data', 'quotes.json');

type DbQuoteRecord = {
  id: string;
  customerName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  jobAddress: string;
  estimateAmount: number;
  dateSent: Date;
  status: QuoteStatus;
  nextFollowUpAt: Date | null;
  lastContactAt: Date | null;
  notes: string | null;
  activities: {
    id: string;
    quoteId: string;
    type: ActivityType;
    summary: string;
    createdAt: Date;
  }[];
};

type QuoteFieldsPatch = Partial<Pick<Quote, 'customerName' | 'contactName' | 'phone' | 'email' | 'jobAddress' | 'estimateAmount' | 'dateSent' | 'status' | 'nextFollowUpAt' | 'lastContactAt' | 'notes'>>;

type QuoteStatusUpdate = {
  status: QuoteStatus;
  nextFollowUpAt?: string;
};

type QuoteTransaction = {
  readQuoteById(id: string): Promise<Quote | null>;
  createQuoteRecord(quote: Quote): Promise<Quote>;
  updateQuoteFieldsRecord(id: string, patch: QuoteFieldsPatch): Promise<Quote | null>;
  appendQuoteActivityRecord(id: string, activity: Activity): Promise<Quote | null>;
  updateQuoteStatusRecord(id: string, update: QuoteStatusUpdate): Promise<Quote | null>;
};

function fromDbQuote(record: DbQuoteRecord): Quote {
  return {
    id: record.id,
    customerName: record.customerName,
    contactName: record.contactName ?? undefined,
    phone: record.phone ?? undefined,
    email: record.email ?? undefined,
    jobAddress: record.jobAddress,
    estimateAmount: record.estimateAmount,
    dateSent: record.dateSent.toISOString(),
    status: record.status,
    nextFollowUpAt: record.nextFollowUpAt?.toISOString(),
    lastContactAt: record.lastContactAt?.toISOString(),
    notes: record.notes ?? undefined,
    activities: record.activities.map((activity) => ({
      id: activity.id,
      quoteId: activity.quoteId,
      type: activity.type,
      summary: activity.summary,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

function quoteOrder(a: Quote, b: Quote) {
  return new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime();
}

async function readFileQuotes(): Promise<Quote[]> {
  const raw = await fs.readFile(quotesFilePath, 'utf8');
  return (JSON.parse(raw) as Quote[]).sort(quoteOrder);
}

async function writeFileQuotes(quotes: Quote[]) {
  await fs.writeFile(quotesFilePath, JSON.stringify([...quotes].sort(quoteOrder), null, 2) + '\n', 'utf8');
}

async function mutateFileQuotes<T>(mutator: (quotes: Quote[]) => T | Promise<T>): Promise<T> {
  const quotes = await readFileQuotes();
  const result = await mutator(quotes);
  await writeFileQuotes(quotes);
  return result;
}

function createFileTransaction(quotes: Quote[]): QuoteTransaction {
  return {
    async readQuoteById(id: string) {
      return quotes.find((quote) => quote.id === id) ?? null;
    },
    async createQuoteRecord(quote: Quote) {
      quotes.unshift(quote);
      return quote;
    },
    async updateQuoteFieldsRecord(id: string, patch: QuoteFieldsPatch) {
      const index = quotes.findIndex((quote) => quote.id === id);
      if (index === -1) return null;

      quotes[index] = {
        ...quotes[index],
        ...patch,
      };

      return quotes[index];
    },
    async appendQuoteActivityRecord(id: string, activity: Activity) {
      const index = quotes.findIndex((quote) => quote.id === id);
      if (index === -1) return null;

      quotes[index] = {
        ...quotes[index],
        activities: [...quotes[index].activities, activity],
      };

      return quotes[index];
    },
    async updateQuoteStatusRecord(id: string, update: QuoteStatusUpdate) {
      const index = quotes.findIndex((quote) => quote.id === id);
      if (index === -1) return null;

      quotes[index] = {
        ...quotes[index],
        status: update.status,
        ...(update.nextFollowUpAt !== undefined ? { nextFollowUpAt: update.nextFollowUpAt } : {}),
      };

      return quotes[index];
    },
  };
}

async function readDbQuotes(): Promise<Quote[]> {
  const prisma = getPrismaClient();
  const quotes = await prisma.quote.findMany({
    include: {
      activities: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { dateSent: 'desc' },
  });

  return quotes.map(fromDbQuote);
}

async function getDbQuote(id: string): Promise<Quote | null> {
  const prisma = getPrismaClient();
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return quote ? fromDbQuote(quote) : null;
}

async function writeDbQuotes(quotes: Quote[]) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    await tx.activity.deleteMany();
    await tx.quote.deleteMany();

    for (const quote of quotes) {
      await tx.quote.create({
        data: {
          id: quote.id,
          customerName: quote.customerName,
          contactName: quote.contactName ?? null,
          phone: quote.phone ?? null,
          email: quote.email ?? null,
          jobAddress: quote.jobAddress,
          estimateAmount: quote.estimateAmount,
          dateSent: new Date(quote.dateSent),
          status: quote.status,
          nextFollowUpAt: quote.nextFollowUpAt ? new Date(quote.nextFollowUpAt) : null,
          lastContactAt: quote.lastContactAt ? new Date(quote.lastContactAt) : null,
          notes: quote.notes ?? null,
          activities: {
            create: quote.activities.map((activity: Activity) => ({
              id: activity.id,
              type: activity.type,
              summary: activity.summary,
              createdAt: new Date(activity.createdAt),
            })),
          },
        },
      });
    }
  });
}

function toDbQuotePatch(patch: QuoteFieldsPatch) {
  return {
    ...('customerName' in patch ? { customerName: patch.customerName ?? '' } : {}),
    ...('contactName' in patch ? { contactName: patch.contactName ?? null } : {}),
    ...('phone' in patch ? { phone: patch.phone ?? null } : {}),
    ...('email' in patch ? { email: patch.email ?? null } : {}),
    ...('jobAddress' in patch ? { jobAddress: patch.jobAddress ?? '' } : {}),
    ...('estimateAmount' in patch ? { estimateAmount: patch.estimateAmount ?? 0 } : {}),
    ...('dateSent' in patch && patch.dateSent ? { dateSent: new Date(patch.dateSent) } : {}),
    ...('status' in patch && patch.status ? { status: patch.status } : {}),
    ...('nextFollowUpAt' in patch ? { nextFollowUpAt: patch.nextFollowUpAt ? new Date(patch.nextFollowUpAt) : null } : {}),
    ...('lastContactAt' in patch ? { lastContactAt: patch.lastContactAt ? new Date(patch.lastContactAt) : null } : {}),
    ...('notes' in patch ? { notes: patch.notes ?? null } : {}),
  };
}

export async function readQuotesStore(): Promise<Quote[]> {
  return dbEnabled() ? readDbQuotes() : readFileQuotes();
}

export async function readQuoteById(id: string): Promise<Quote | null> {
  if (dbEnabled()) {
    return getDbQuote(id);
  }

  const quotes = await readFileQuotes();
  return quotes.find((quote) => quote.id === id) ?? null;
}

export async function withQuoteTransaction<T>(callback: (tx: QuoteTransaction) => Promise<T>): Promise<T> {
  if (dbEnabled()) {
    const prisma = getPrismaClient();
    return prisma.$transaction(async (dbTx) => {
      const tx: QuoteTransaction = {
        async readQuoteById(id: string) {
          const quote = await dbTx.quote.findUnique({
            where: { id },
            include: {
              activities: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          return quote ? fromDbQuote(quote) : null;
        },
        async createQuoteRecord(quote: Quote) {
          await dbTx.quote.create({
            data: {
              id: quote.id,
              customerName: quote.customerName,
              contactName: quote.contactName ?? null,
              phone: quote.phone ?? null,
              email: quote.email ?? null,
              jobAddress: quote.jobAddress,
              estimateAmount: quote.estimateAmount,
              dateSent: new Date(quote.dateSent),
              status: quote.status,
              nextFollowUpAt: quote.nextFollowUpAt ? new Date(quote.nextFollowUpAt) : null,
              lastContactAt: quote.lastContactAt ? new Date(quote.lastContactAt) : null,
              notes: quote.notes ?? null,
              activities: {
                create: quote.activities.map((activity) => ({
                  id: activity.id,
                  type: activity.type,
                  summary: activity.summary,
                  createdAt: new Date(activity.createdAt),
                })),
              },
            },
          });

          return quote;
        },
        async updateQuoteFieldsRecord(id: string, patch: QuoteFieldsPatch) {
          const existing = await dbTx.quote.findUnique({ where: { id } });
          if (!existing) return null;

          await dbTx.quote.update({
            where: { id },
            data: toDbQuotePatch(patch),
          });

          const updated = await dbTx.quote.findUnique({
            where: { id },
            include: {
              activities: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          return updated ? fromDbQuote(updated) : null;
        },
        async appendQuoteActivityRecord(id: string, activity: Activity) {
          const existing = await dbTx.quote.findUnique({ where: { id } });
          if (!existing) return null;

          await dbTx.activity.create({
            data: {
              id: activity.id,
              quoteId: id,
              type: activity.type,
              summary: activity.summary,
              createdAt: new Date(activity.createdAt),
            },
          });

          const updated = await dbTx.quote.findUnique({
            where: { id },
            include: {
              activities: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          return updated ? fromDbQuote(updated) : null;
        },
        async updateQuoteStatusRecord(id: string, update: QuoteStatusUpdate) {
          const existing = await dbTx.quote.findUnique({ where: { id } });
          if (!existing) return null;

          await dbTx.quote.update({
            where: { id },
            data: {
              status: update.status,
              ...(update.nextFollowUpAt !== undefined
                ? { nextFollowUpAt: update.nextFollowUpAt ? new Date(update.nextFollowUpAt) : null }
                : {}),
            },
          });

          const updated = await dbTx.quote.findUnique({
            where: { id },
            include: {
              activities: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          return updated ? fromDbQuote(updated) : null;
        },
      };

      return callback(tx);
    });
  }

  return mutateFileQuotes(async (quotes) => {
    const tx = createFileTransaction(quotes);
    return callback(tx);
  });
}

export async function writeQuotesStore(quotes: Quote[]) {
  if (dbEnabled()) {
    await writeDbQuotes(quotes);
    return;
  }

  await writeFileQuotes(quotes);
}

export async function createQuoteRecord(quote: Quote) {
  return withQuoteTransaction((tx) => tx.createQuoteRecord(quote));
}

export async function updateQuoteFieldsRecord(id: string, patch: QuoteFieldsPatch): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.updateQuoteFieldsRecord(id, patch));
}

export async function appendQuoteActivityRecord(id: string, activity: Activity): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.appendQuoteActivityRecord(id, activity));
}

export async function updateQuoteStatusRecord(id: string, update: QuoteStatusUpdate): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.updateQuoteStatusRecord(id, update));
}

export async function generateQuoteId() {
  return `QC-${randomUUID()}`;
}

export async function generateActivityId() {
  return `A-${randomUUID()}`;
}

export async function seedDatabaseFromFile() {
  if (!dbEnabled()) {
    throw new Error('DATABASE_URL is required to seed the Postgres database.');
  }

  const quotes = await readFileQuotes();
  await writeDbQuotes(quotes);
}
