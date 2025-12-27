// ===========================================
// Load CSV inventory data into database
// Run with: npx tsx prisma/load-csv.ts
// ===========================================

import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { join } from 'path';

const prisma = new PrismaClient();

interface CSVRow {
  sku: string;
  name: string;
  category: string;
  description: string;
  price_cents: string;
  stock: string;
  aisle: string;
  bin: string;
  tags: string;
  attributes_json: string;
}

async function loadCSV() {
  console.log('📦 Loading CSV inventory data...');

  // Get the demo store
  const store = await prisma.store.findUnique({
    where: { slug: 'demo-hardware-store' },
  });

  if (!store) {
    console.error('❌ Demo store not found. Run seed first: npx tsx prisma/seed.ts');
    process.exit(1);
  }

  const csvPath = join(__dirname, 'seed-data', 'picture-hanging.csv');
  const records: CSVRow[] = [];

  // Parse CSV
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    records.push(record as CSVRow);
  }

  console.log(`📋 Found ${records.length} items in CSV`);

  let created = 0;
  let updated = 0;

  for (const row of records) {
    // Convert tags from pipe-separated to JSON array
    const tags = row.tags.split('|').map((t) => t.trim());
    
    // Parse attributes JSON
    let attributes = {};
    try {
      attributes = JSON.parse(row.attributes_json);
    } catch (e) {
      console.warn(`⚠️ Invalid JSON for ${row.sku}:`, row.attributes_json);
    }

    const data = {
      sku: row.sku,
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price_cents) / 100,
      stock: parseInt(row.stock, 10),
      aisle: row.aisle,
      bin: row.bin || null,
      tags: JSON.stringify(tags),
      attributes: JSON.stringify(attributes),
      storeId: store.id,
    };

    const existing = await prisma.inventoryItem.findUnique({
      where: {
        sku_storeId: {
          sku: row.sku,
          storeId: store.id,
        },
      },
    });

    if (existing) {
      await prisma.inventoryItem.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.inventoryItem.create({ data });
      created++;
    }
  }

  console.log(`✅ Created ${created} new items, updated ${updated} existing items`);
  console.log('🎉 CSV load complete!');
}

loadCSV()
  .catch((e) => {
    console.error('❌ Load failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
