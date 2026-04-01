import { seedDatabaseFromFile } from '@/lib/repository';

async function main() {
  await seedDatabaseFromFile();
  console.log('Seeded database from data/quotes.json');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
