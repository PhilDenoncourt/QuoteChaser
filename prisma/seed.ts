async function main() {
  console.log('No seed action is configured. Quote Chaser now runs in database-only mode without file-import seeding.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
