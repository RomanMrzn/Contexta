import prisma from '../lib/prisma.js';

async function main() {
  console.log('Testing pgvector with Prisma...');

  // 1. Create a dummy document
  const document = await prisma.document.create({
    data: {
      userId: 'test_user_1',
      title: 'Vector Test Document',
      key: 'test_key',
      url: 'https://example.com/test.pdf',
    },
  });
  console.log(`Created document with ID: ${document.id}`);

  // 2. Insert a dummy vector (e.g., 1536 dimensions, all 0s except first element)
  const embedding = Array(1536).fill(0);
  embedding[0] = 1;
  const embedding2 = Array(1536).fill(0);
  embedding2[0] = 0.9;
  embedding2[1] = 0.1;

  // We use $executeRaw for inserting pgvector data using the ::vector cast
  await prisma.$executeRaw`
    INSERT INTO "DocumentChunk" ("id", "documentId", "content", "embedding")
    VALUES (
      gen_random_uuid(), 
      ${document.id}, 
      'This is a test chunk 1', 
      ${embedding}::vector
    ),
    (
      gen_random_uuid(), 
      ${document.id}, 
      'This is a test chunk 2', 
      ${embedding2}::vector
    )
  `;
  console.log('Inserted chunks with embeddings.');

  // 3. Query the vectors using Cosine Distance (<=>)
  const queryEmbedding = Array(1536).fill(0);
  queryEmbedding[0] = 1;

  const result = await prisma.$queryRaw`
    SELECT id, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "DocumentChunk"
    WHERE "documentId" = ${document.id}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 2;
  `;

  console.log('Vector Search Results:');
  console.dir(result, { depth: null });

  // 4. Cleanup
  await prisma.document.delete({ where: { id: document.id } });
  console.log('Test completed and cleaned up.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
