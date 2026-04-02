import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '@/lib/db';
import type { Activity, ActivityType, Quote, QuoteStatus } from '@/lib/domain';
const defaultOrganization = {
  id: 'org_migrated_demo',
  name: 'Migrated Demo Organization',
  slug: 'migrated-demo-organization',
};

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
  organizationId: string;
  activities: {
    id: string;
    quoteId: string;
    type: ActivityType;
    summary: string;
    createdAt: Date;
    organizationId: string;
  }[];
};

type QuoteFieldsPatch = Partial<Pick<Quote, 'customerName' | 'contactName' | 'phone' | 'email' | 'jobAddress' | 'estimateAmount' | 'dateSent' | 'status' | 'nextFollowUpAt' | 'lastContactAt' | 'notes'>>;

type QuoteStatusUpdate = {
  status: QuoteStatus;
  nextFollowUpAt?: string;
};

type QuoteTransaction = {
  readQuoteById(organizationId: string, id: string): Promise<Quote | null>;
  createQuoteRecord(organizationId: string, quote: Quote): Promise<Quote>;
  updateQuoteFieldsRecord(organizationId: string, id: string, patch: QuoteFieldsPatch): Promise<Quote | null>;
  appendQuoteActivityRecord(organizationId: string, id: string, activity: Activity): Promise<Quote | null>;
  updateQuoteStatusRecord(organizationId: string, id: string, update: QuoteStatusUpdate): Promise<Quote | null>;
};

export type RepositoryUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
};

export type RepositoryMembership = {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'member';
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type SessionRecordInput = {
  id: string;
  userId: string;
  organizationId: string;
  membershipRole: 'owner' | 'member';
  tokenHash: string;
  expiresAt: Date;
};

export type SessionRecord = {
  id: string;
  userId: string;
  organizationId: string;
  membershipRole: 'owner' | 'member';
  expiresAt: Date;
};

export type PasswordResetTokenRecordInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export type CreateUserWithOrganizationInput = {
  userId: string;
  organizationId: string;
  membershipId: string;
  email: string;
  name: string | null;
  passwordHash: string;
  organizationName: string;
  organizationSlug: string;
  role: 'owner' | 'member';
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

async function readDbQuotesForOrganization(organizationId: string): Promise<Quote[]> {
  const prisma = getPrismaClient();
  const quotes = await prisma.quote.findMany({
    where: { organizationId },
    include: {
      activities: {
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { dateSent: 'desc' },
  });

  return quotes.map(fromDbQuote);
}

async function getDbQuoteForOrganization(id: string, organizationId: string): Promise<Quote | null> {
  const prisma = getPrismaClient();
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId },
    include: {
      activities: {
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return quote ? fromDbQuote(quote) : null;
}

async function ensureDefaultOrganization() {
  const prisma = getPrismaClient();
  await prisma.organization.upsert({
    where: { slug: defaultOrganization.slug },
    update: {
      name: defaultOrganization.name,
    },
    create: defaultOrganization,
  });

  return defaultOrganization;
}

async function writeDbQuotes(quotes: Quote[]) {
  const prisma = getPrismaClient();
  const organization = await ensureDefaultOrganization();

  await prisma.$transaction(async (tx) => {
    await tx.activity.deleteMany();
    await tx.quote.deleteMany();

    for (const quote of quotes) {
      await tx.quote.create({
        data: {
          id: quote.id,
          organizationId: organization.id,
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
              organizationId: organization.id,
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
  return readDbQuotesForOrganization(defaultOrganization.id);
}

export async function readQuotesStoreForOrganization(organizationId: string): Promise<Quote[]> {
  return readDbQuotesForOrganization(organizationId);
}

export async function readQuoteById(id: string): Promise<Quote | null> {
  return getDbQuoteForOrganization(id, defaultOrganization.id);
}

export async function readQuoteByIdForOrganization(id: string, organizationId: string): Promise<Quote | null> {
  return getDbQuoteForOrganization(id, organizationId);
}

export async function withQuoteTransaction<T>(callback: (tx: QuoteTransaction) => Promise<T>): Promise<T> {
  const prisma = getPrismaClient();
  return prisma.$transaction(async (dbTx) => {
    const tx: QuoteTransaction = {
      async readQuoteById(organizationId: string, id: string) {
        const quote = await dbTx.quote.findFirst({
          where: { id, organizationId },
          include: {
            activities: {
              where: { organizationId },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        return quote ? fromDbQuote(quote) : null;
      },
      async createQuoteRecord(organizationId: string, quote: Quote) {
        const organization = await dbTx.organization.findUnique({
          where: { id: organizationId },
        });

        if (!organization) {
          throw new Error('Organization must exist before creating quote records.');
        }

        await dbTx.quote.create({
          data: {
            id: quote.id,
            organizationId,
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
                organizationId,
                type: activity.type,
                summary: activity.summary,
                createdAt: new Date(activity.createdAt),
              })),
            },
          },
        });

        return quote;
      },
      async updateQuoteFieldsRecord(organizationId: string, id: string, patch: QuoteFieldsPatch) {
        const existing = await dbTx.quote.findFirst({ where: { id, organizationId } });
        if (!existing) return null;

        await dbTx.quote.update({
          where: { id },
          data: toDbQuotePatch(patch),
        });

        const updated = await dbTx.quote.findFirst({
          where: { id, organizationId },
          include: {
            activities: {
              where: { organizationId },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        return updated ? fromDbQuote(updated) : null;
      },
      async appendQuoteActivityRecord(organizationId: string, id: string, activity: Activity) {
        const existing = await dbTx.quote.findFirst({ where: { id, organizationId } });
        if (!existing) return null;

        await dbTx.activity.create({
          data: {
            id: activity.id,
            organizationId,
            quoteId: id,
            type: activity.type,
            summary: activity.summary,
            createdAt: new Date(activity.createdAt),
          },
        });

        const updated = await dbTx.quote.findFirst({
          where: { id, organizationId },
          include: {
            activities: {
              where: { organizationId },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        return updated ? fromDbQuote(updated) : null;
      },
      async updateQuoteStatusRecord(organizationId: string, id: string, update: QuoteStatusUpdate) {
        const existing = await dbTx.quote.findFirst({ where: { id, organizationId } });
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

        const updated = await dbTx.quote.findFirst({
          where: { id, organizationId },
          include: {
            activities: {
              where: { organizationId },
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

export async function writeQuotesStore(quotes: Quote[]) {
  await writeDbQuotes(quotes);
}

export async function createQuoteRecordForOrganization(organizationId: string, quote: Quote) {
  return withQuoteTransaction((tx) => tx.createQuoteRecord(organizationId, quote));
}

export async function updateQuoteFieldsRecordForOrganization(organizationId: string, id: string, patch: QuoteFieldsPatch): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.updateQuoteFieldsRecord(organizationId, id, patch));
}

export async function appendQuoteActivityRecordForOrganization(organizationId: string, id: string, activity: Activity): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.appendQuoteActivityRecord(organizationId, id, activity));
}

export async function updateQuoteStatusRecordForOrganization(organizationId: string, id: string, update: QuoteStatusUpdate): Promise<Quote | null> {
  return withQuoteTransaction((tx) => tx.updateQuoteStatusRecord(organizationId, id, update));
}

export async function generateQuoteId() {
  return `QC-${randomUUID()}`;
}

export async function generateActivityId() {
  return `A-${randomUUID()}`;
}

export async function backfillDefaultOrganizationForExistingData() {
  const prisma = getPrismaClient();
  const organization = await ensureDefaultOrganization();

  await prisma.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: {
        organizationId: '',
      },
      data: {
        organizationId: organization.id,
      },
    });

    await tx.activity.updateMany({
      where: {
        organizationId: '',
      },
      data: {
        organizationId: organization.id,
      },
    });
  });
}

export async function getUserByEmail(email: string): Promise<RepositoryUser | null> {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user;
}

export async function getCurrentMembershipForUser(userId: string): Promise<RepositoryMembership | null> {
  const prisma = getPrismaClient();
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return membership;
}

export async function getUserWithCurrentMembership(userId: string) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    membership: user.memberships[0] ?? null,
  };
}

export async function createUserWithOrganization(input: CreateUserWithOrganizationInput) {
  const prisma = getPrismaClient();
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        id: input.organizationId,
        name: input.organizationName,
        slug: input.organizationSlug,
      },
    });

    const user = await tx.user.create({
      data: {
        id: input.userId,
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
      },
    });

    const membership = await tx.membership.create({
      data: {
        id: input.membershipId,
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role,
      },
      include: {
        organization: true,
      },
    });

    return {
      user,
      organization,
      membership,
    };
  });
}

export async function upsertSessionRecord(input: SessionRecordInput) {
  const prisma = getPrismaClient();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.membershipRole,
    },
  });

  if (!membership) {
    throw new Error('Cannot create session without a valid membership.');
  }

  await prisma.session.create({
    data: {
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

export async function getSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              organization: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  const membership = session.user.memberships[0];
  if (!membership) return null;

  return {
    id: session.id,
    userId: session.userId,
    organizationId: membership.organizationId,
    membershipRole: membership.role,
    expiresAt: session.expiresAt,
  };
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const prisma = getPrismaClient();
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function createPasswordResetTokenRecord(input: PasswordResetTokenRecordInput) {
  const prisma = getPrismaClient();

  await prisma.passwordResetToken.create({
    data: {
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

export async function getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
  const prisma = getPrismaClient();
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
}

export async function markPasswordResetTokenUsed(id: string) {
  const prisma = getPrismaClient();
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function deleteExpiredPasswordResetTokens() {
  const prisma = getPrismaClient();
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const prisma = getPrismaClient();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deleteSessionsForUser(userId: string) {
  const prisma = getPrismaClient();
  await prisma.session.deleteMany({
    where: { userId },
  });
}
