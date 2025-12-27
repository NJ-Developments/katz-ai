// ===========================================
// Database Seed Script
// Creates demo store, users, and inventory
// ===========================================

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============ CREATE DEMO STORE ============
  const store = await prisma.store.upsert({
    where: { slug: 'demo-hardware-store' },
    update: {},
    create: {
      name: 'Demo Hardware Store',
      slug: 'demo-hardware-store',
      address: '123 Main Street, Anytown, USA 12345',
      policies: {
        preferNoDamage: false,
        preferNoTools: false,
        suggestDrillingFirst: false,
        safetyDisclaimers: true,
        customInstructions: 'Always greet customers warmly and offer to walk them to the product location.',
      },
    },
  });
  console.log(`✅ Created store: ${store.name}`);

  // ============ CREATE USERS ============
  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo-store.com' },
    update: {},
    create: {
      email: 'manager@demo-store.com',
      passwordHash,
      name: 'Store Manager',
      role: UserRole.MANAGER,
      storeId: store.id,
    },
  });
  console.log(`✅ Created manager: ${manager.email}`);

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo-store.com' },
    update: {},
    create: {
      email: 'employee@demo-store.com',
      passwordHash,
      name: 'Store Employee',
      role: UserRole.EMPLOYEE,
      storeId: store.id,
    },
  });
  console.log(`✅ Created employee: ${employee.email}`);

  // ============ CREATE DEMO INVENTORY ============
  const inventoryItems = [
    // Picture Hanging - No Damage Options
    {
      sku: 'CMD-STRIPS-SM',
      name: 'Command Small Picture Hanging Strips (4-Pack)',
      description: 'Damage-free hanging strips. Holds up to 4 lbs. Perfect for small frames on smooth surfaces.',
      category: 'hanging',
      price: 5.99,
      stock: 52,
      aisle: 'A3',
      bin: '11',
      tags: ['no-damage', 'rental-friendly', 'no-tools', 'picture-hanging'],
      attributes: {
        weight_capacity_lbs: 4,
        surface_types: ['painted drywall', 'glass', 'tile', 'metal'],
        pack_size: 4,
        brand: 'Command',
        removable: true,
      },
    },
    {
      sku: 'CMD-STRIPS-MED',
      name: 'Command Medium Picture Hanging Strips (6-Pack)',
      description: 'Damage-free hanging strips. Holds up to 12 lbs. Great for medium frames and canvases.',
      category: 'hanging',
      price: 8.99,
      stock: 45,
      aisle: 'A3',
      bin: '12',
      tags: ['no-damage', 'rental-friendly', 'no-tools', 'picture-hanging'],
      attributes: {
        weight_capacity_lbs: 12,
        surface_types: ['painted drywall', 'glass', 'tile', 'metal'],
        pack_size: 6,
        brand: 'Command',
        removable: true,
      },
    },
    {
      sku: 'CMD-STRIPS-LG',
      name: 'Command Large Picture Hanging Strips (8-Pack)',
      description: 'Heavy duty damage-free strips. Holds up to 16 lbs. For larger frames and mirrors.',
      category: 'hanging',
      price: 12.99,
      stock: 38,
      aisle: 'A3',
      bin: '13',
      tags: ['no-damage', 'rental-friendly', 'no-tools', 'picture-hanging', 'heavy-duty'],
      attributes: {
        weight_capacity_lbs: 16,
        surface_types: ['painted drywall', 'glass', 'tile', 'metal'],
        pack_size: 8,
        brand: 'Command',
        removable: true,
      },
    },
    {
      sku: 'MONKEY-HOOK-10',
      name: 'Monkey Hooks Picture Hangers (10-Pack)',
      description: 'Innovative no-tool picture hangers. Simply push into drywall. Holds up to 35 lbs. Leaves tiny hole.',
      category: 'hanging',
      price: 9.99,
      stock: 25,
      aisle: 'A3',
      bin: '14',
      tags: ['no-tools', 'minimal-damage', 'picture-hanging', 'drywall-only'],
      attributes: {
        weight_capacity_lbs: 35,
        surface_types: ['drywall'],
        pack_size: 10,
        brand: 'Monkey Hook',
        hole_size: 'pinhole',
        requires_drill: false,
      },
    },
    {
      sku: 'MONKEY-HOOK-50',
      name: 'Monkey Hooks Heavy Duty (5-Pack)',
      description: 'Heavy duty gorilla hook hangers. Push into drywall. Holds up to 50 lbs for mirrors and large art.',
      category: 'hanging',
      price: 14.99,
      stock: 18,
      aisle: 'A3',
      bin: '15',
      tags: ['no-tools', 'minimal-damage', 'picture-hanging', 'heavy-duty', 'drywall-only'],
      attributes: {
        weight_capacity_lbs: 50,
        surface_types: ['drywall'],
        pack_size: 5,
        brand: 'Monkey Hook',
        hole_size: 'small',
        requires_drill: false,
      },
    },
    // Traditional Hardware Options
    {
      sku: 'DRYWALL-ANCHOR-50',
      name: 'Drywall Anchors Assorted (50-Pack)',
      description: 'Plastic expansion anchors for drywall. Various sizes. Requires drilling. Holds 20-75 lbs.',
      category: 'hardware',
      price: 12.99,
      stock: 30,
      aisle: 'B2',
      bin: '5',
      tags: ['drilling-required', 'drywall', 'anchors'],
      attributes: {
        weight_capacity_lbs: 75,
        surface_types: ['drywall'],
        pack_size: 50,
        requires_drill: true,
        sizes: ['small', 'medium', 'large'],
      },
    },
    {
      sku: 'TOGGLE-BOLT-20',
      name: 'Toggle Bolts Heavy Duty (20-Pack)',
      description: 'Spring-loaded toggle bolts for hollow walls. Extremely strong. Requires 1/2" hole. Holds up to 100 lbs.',
      category: 'hardware',
      price: 18.99,
      stock: 22,
      aisle: 'B2',
      bin: '7',
      tags: ['drilling-required', 'heavy-duty', 'anchors'],
      attributes: {
        weight_capacity_lbs: 100,
        surface_types: ['drywall', 'plaster', 'hollow doors'],
        pack_size: 20,
        requires_drill: true,
        hole_size: '0.5 inch',
      },
    },
    {
      sku: 'SNAP-TOGGLE-10',
      name: 'Snap Toggle Anchors (10-Pack)',
      description: 'Premium toggle anchors. Easy install, removable and reusable. Holds up to 265 lbs in 1/2" drywall.',
      category: 'hardware',
      price: 24.99,
      stock: 15,
      aisle: 'B2',
      bin: '8',
      tags: ['drilling-required', 'heavy-duty', 'premium', 'reusable'],
      attributes: {
        weight_capacity_lbs: 265,
        surface_types: ['drywall', 'plaster'],
        pack_size: 10,
        requires_drill: true,
        reusable: true,
        brand: 'Toggler',
      },
    },
    // Adhesive Options
    {
      sku: 'VELCRO-STRIPS-15',
      name: 'Industrial Velcro Strips (15-Pack)',
      description: 'Heavy duty Velcro strips for mounting. Holds up to 10 lbs. Great for tiles and smooth surfaces.',
      category: 'adhesives',
      price: 11.99,
      stock: 40,
      aisle: 'A4',
      bin: '3',
      tags: ['no-damage', 'rental-friendly', 'no-tools', 'adhesive'],
      attributes: {
        weight_capacity_lbs: 10,
        surface_types: ['tile', 'glass', 'metal', 'painted drywall'],
        pack_size: 15,
        brand: 'Velcro',
        removable: true,
      },
    },
    {
      sku: 'MOUNTING-TAPE-HD',
      name: 'Heavy Duty Mounting Tape (15ft)',
      description: 'Double-sided mounting tape. Permanent bond. Holds up to 25 lbs. For indoor/outdoor use.',
      category: 'adhesives',
      price: 8.99,
      stock: 55,
      aisle: 'A4',
      bin: '5',
      tags: ['no-tools', 'permanent', 'adhesive', 'indoor-outdoor'],
      attributes: {
        weight_capacity_lbs: 25,
        surface_types: ['wood', 'metal', 'plastic', 'painted surfaces'],
        length_ft: 15,
        brand: '3M',
        waterproof: true,
        permanent: true,
      },
    },
    // Tools
    {
      sku: 'STUD-FINDER-DIG',
      name: 'Digital Stud Finder with LCD',
      description: 'Electronic stud finder. Detects wood/metal studs, AC wiring, and pipes. Essential for safe drilling.',
      category: 'tools',
      price: 29.99,
      stock: 12,
      aisle: 'C1',
      bin: '22',
      tags: ['tools', 'safety', 'detection'],
      attributes: {
        detection_depth: '1.5 inches',
        detects: ['wood studs', 'metal studs', 'AC wiring', 'pipes'],
        battery: '9V',
        brand: 'Zircon',
      },
    },
    {
      sku: 'LEVEL-TORPEDO',
      name: 'Torpedo Level 9-inch',
      description: 'Magnetic torpedo level. Essential for hanging pictures straight. Built-in ruler.',
      category: 'tools',
      price: 12.99,
      stock: 28,
      aisle: 'C1',
      bin: '15',
      tags: ['tools', 'leveling', 'magnetic'],
      attributes: {
        length_inches: 9,
        magnetic: true,
        vials: 3,
        brand: 'Stanley',
      },
    },
    {
      sku: 'DRILL-BITS-SET',
      name: 'Drill Bit Set (29-Piece)',
      description: 'Titanium coated drill bits. For wood, metal, and plastic. Sizes 1/16" to 1/2".',
      category: 'tools',
      price: 34.99,
      stock: 20,
      aisle: 'C2',
      bin: '8',
      tags: ['tools', 'drilling', 'bits'],
      attributes: {
        piece_count: 29,
        material: 'titanium-coated HSS',
        surfaces: ['wood', 'metal', 'plastic'],
        brand: 'DeWalt',
      },
    },
    // Specialty Items
    {
      sku: 'PICTURE-WIRE-50',
      name: 'Picture Hanging Wire (50ft)',
      description: 'Braided stainless steel wire. Supports up to 50 lbs. Use with D-rings or eye hooks.',
      category: 'hanging',
      price: 7.99,
      stock: 35,
      aisle: 'A3',
      bin: '20',
      tags: ['picture-hanging', 'accessories', 'wire'],
      attributes: {
        weight_capacity_lbs: 50,
        length_ft: 50,
        material: 'stainless steel',
      },
    },
    {
      sku: 'D-RING-HANGERS',
      name: 'D-Ring Picture Hangers (20-Pack)',
      description: 'Heavy duty D-ring hangers with screws. For wood frames. Professional quality.',
      category: 'hanging',
      price: 6.99,
      stock: 42,
      aisle: 'A3',
      bin: '21',
      tags: ['picture-hanging', 'accessories', 'frame-hardware'],
      attributes: {
        weight_capacity_lbs: 30,
        pack_size: 20,
        includes_screws: true,
      },
    },
    {
      sku: 'SAWTOOTH-HANG-50',
      name: 'Sawtooth Picture Hangers (50-Pack)',
      description: 'Classic sawtooth hangers for lightweight frames. Easy nail-on installation.',
      category: 'hanging',
      price: 4.99,
      stock: 60,
      aisle: 'A3',
      bin: '22',
      tags: ['picture-hanging', 'accessories', 'lightweight'],
      attributes: {
        weight_capacity_lbs: 10,
        pack_size: 50,
        nail_included: true,
      },
    },
    // Concrete/Masonry
    {
      sku: 'CONCRETE-ANCHOR-10',
      name: 'Concrete Anchors (10-Pack)',
      description: 'Wedge anchors for concrete and masonry. Requires hammer drill. Holds up to 200 lbs.',
      category: 'hardware',
      price: 16.99,
      stock: 25,
      aisle: 'B3',
      bin: '12',
      tags: ['drilling-required', 'concrete', 'masonry', 'heavy-duty'],
      attributes: {
        weight_capacity_lbs: 200,
        surface_types: ['concrete', 'brick', 'stone'],
        pack_size: 10,
        requires_hammer_drill: true,
      },
    },
    {
      sku: 'TAPCON-SCREWS-25',
      name: 'Tapcon Concrete Screws (25-Pack)',
      description: 'Self-tapping concrete screws. Blue coating for corrosion resistance. Drill bit included.',
      category: 'hardware',
      price: 14.99,
      stock: 32,
      aisle: 'B3',
      bin: '14',
      tags: ['drilling-required', 'concrete', 'masonry'],
      attributes: {
        weight_capacity_lbs: 150,
        surface_types: ['concrete', 'brick', 'block'],
        pack_size: 25,
        bit_included: true,
        brand: 'Tapcon',
      },
    },
    // Low Stock Item (for testing)
    {
      sku: 'CMD-HOOKS-OUTDOOR',
      name: 'Command Outdoor Hooks (2-Pack)',
      description: 'Weather-resistant hooks for outdoor use. Holds up to 4 lbs. UV and water resistant.',
      category: 'hanging',
      price: 9.99,
      stock: 3, // Low stock!
      aisle: 'A3',
      bin: '25',
      tags: ['no-damage', 'outdoor', 'weather-resistant'],
      attributes: {
        weight_capacity_lbs: 4,
        surface_types: ['vinyl siding', 'stucco', 'wood'],
        pack_size: 2,
        brand: 'Command',
        outdoor: true,
        uv_resistant: true,
      },
    },
    // Out of Stock Item (for testing)
    {
      sku: 'FRENCH-CLEAT-KIT',
      name: 'French Cleat Mounting Kit',
      description: 'Professional heavy-duty mounting system. For cabinets, TVs, heavy mirrors. Requires studs.',
      category: 'hanging',
      price: 29.99,
      stock: 0, // Out of stock!
      aisle: 'A4',
      bin: '30',
      tags: ['heavy-duty', 'drilling-required', 'professional'],
      attributes: {
        weight_capacity_lbs: 500,
        surface_types: ['studs', 'wood'],
        requires_drill: true,
        requires_studs: true,
      },
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: {
        sku_storeId: {
          sku: item.sku,
          storeId: store.id,
        },
      },
      update: item,
      create: {
        ...item,
        storeId: store.id,
      },
    });
  }
  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Manager: manager@demo-store.com / Demo123!');
  console.log('   Employee: employee@demo-store.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
