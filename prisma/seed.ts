import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Hardware Store',
      slug: 'demo-store',
    },
  })
  console.log('✓ Store created:', store.name)

  // Create demo users
  const passwordHash = await bcrypt.hash('Demo123!', 10)

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo-store.com' },
    update: {},
    create: {
      email: 'employee@demo-store.com',
      passwordHash,
      name: 'Demo Employee',
      role: 'EMPLOYEE',
      storeId: store.id,
    },
  })
  console.log('✓ Employee created:', employee.email)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo-store.com' },
    update: {},
    create: {
      email: 'manager@demo-store.com',
      passwordHash,
      name: 'Demo Manager',
      role: 'MANAGER',
      storeId: store.id,
    },
  })
  console.log('✓ Manager created:', manager.email)

  // Create demo products - 100 hardware store items
  const products = [
    // HAND TOOLS (1-15)
    { sku: 'HT-HAMMER-16', name: '16 oz Claw Hammer', description: 'Steel head with fiberglass handle. Great for general purpose nailing and pry work.', category: 'hand-tools', price: 18.99, stock: 45, aisle: 'A1', bin: '1', tags: JSON.stringify(['hammer', 'striking', 'essential']), attributes: JSON.stringify({ weight_oz: 16, handle: 'fiberglass' }) },
    { sku: 'HT-HAMMER-20', name: '20 oz Framing Hammer', description: 'Heavy duty steel hammer for framing and construction work.', category: 'hand-tools', price: 24.99, stock: 32, aisle: 'A1', bin: '2', tags: JSON.stringify(['hammer', 'framing', 'construction']), attributes: JSON.stringify({ weight_oz: 20, handle: 'wood' }) },
    { sku: 'HT-SCREWSET-32', name: '32-Piece Screwdriver Set', description: 'Phillips, flathead, and Torx drivers with magnetic tips.', category: 'hand-tools', price: 29.99, stock: 28, aisle: 'A1', bin: '5', tags: JSON.stringify(['screwdriver', 'set', 'magnetic']), attributes: JSON.stringify({ pieces: 32, magnetic: true }) },
    { sku: 'HT-PLIERS-NEEDLE', name: 'Needle Nose Pliers 6"', description: 'Precision pliers for tight spaces and wire work.', category: 'hand-tools', price: 12.99, stock: 55, aisle: 'A1', bin: '8', tags: JSON.stringify(['pliers', 'precision', 'wire']), attributes: JSON.stringify({ length_in: 6, jaw_type: 'needle' }) },
    { sku: 'HT-PLIERS-SLIP', name: 'Slip Joint Pliers 8"', description: 'Adjustable pliers for gripping various sizes.', category: 'hand-tools', price: 11.99, stock: 48, aisle: 'A1', bin: '9', tags: JSON.stringify(['pliers', 'adjustable', 'gripping']), attributes: JSON.stringify({ length_in: 8, adjustable: true }) },
    { sku: 'HT-WRENCH-ADJ10', name: 'Adjustable Wrench 10"', description: 'Chrome vanadium steel adjustable wrench.', category: 'hand-tools', price: 16.99, stock: 40, aisle: 'A1', bin: '12', tags: JSON.stringify(['wrench', 'adjustable', 'chrome']), attributes: JSON.stringify({ length_in: 10, material: 'chrome vanadium' }) },
    { sku: 'HT-WRENCH-SET-SAE', name: 'SAE Combination Wrench Set (11-Piece)', description: 'Standard sizes from 1/4" to 7/8".', category: 'hand-tools', price: 34.99, stock: 22, aisle: 'A1', bin: '14', tags: JSON.stringify(['wrench', 'set', 'SAE']), attributes: JSON.stringify({ pieces: 11, type: 'SAE' }) },
    { sku: 'HT-WRENCH-SET-MM', name: 'Metric Combination Wrench Set (12-Piece)', description: 'Metric sizes from 8mm to 19mm.', category: 'hand-tools', price: 36.99, stock: 20, aisle: 'A1', bin: '15', tags: JSON.stringify(['wrench', 'set', 'metric']), attributes: JSON.stringify({ pieces: 12, type: 'metric' }) },
    { sku: 'HT-TAPE-25', name: 'Tape Measure 25 ft', description: 'Retractable steel tape with belt clip and magnetic tip.', category: 'hand-tools', price: 14.99, stock: 65, aisle: 'A2', bin: '1', tags: JSON.stringify(['measuring', 'tape', 'essential']), attributes: JSON.stringify({ length_ft: 25, magnetic: true }) },
    { sku: 'HT-LEVEL-24', name: '24" Torpedo Level', description: 'Aluminum level with 3 vials for horizontal, vertical, and 45°.', category: 'hand-tools', price: 19.99, stock: 35, aisle: 'A2', bin: '4', tags: JSON.stringify(['level', 'measuring', 'aluminum']), attributes: JSON.stringify({ length_in: 24, vials: 3 }) },
    { sku: 'HT-UTIL-KNIFE', name: 'Retractable Utility Knife', description: 'Quick-change blade system with 5 spare blades included.', category: 'hand-tools', price: 9.99, stock: 80, aisle: 'A2', bin: '7', tags: JSON.stringify(['knife', 'cutting', 'retractable']), attributes: JSON.stringify({ blades_included: 5, quick_change: true }) },
    { sku: 'HT-SOCKET-40', name: '40-Piece Socket Set SAE/Metric', description: 'Ratchet with SAE and metric sockets in carrying case.', category: 'hand-tools', price: 49.99, stock: 18, aisle: 'A2', bin: '10', tags: JSON.stringify(['socket', 'ratchet', 'set']), attributes: JSON.stringify({ pieces: 40, drive: '3/8"' }) },
    { sku: 'HT-HEX-SET', name: 'Hex Key Set (30-Piece)', description: 'SAE and metric Allen keys in folding holder.', category: 'hand-tools', price: 15.99, stock: 42, aisle: 'A2', bin: '12', tags: JSON.stringify(['hex', 'allen', 'set']), attributes: JSON.stringify({ pieces: 30, folding: true }) },
    { sku: 'HT-PRY-BAR-12', name: 'Pry Bar 12"', description: 'Flat pry bar for demolition and nail pulling.', category: 'hand-tools', price: 11.99, stock: 38, aisle: 'A2', bin: '15', tags: JSON.stringify(['pry', 'demolition', 'steel']), attributes: JSON.stringify({ length_in: 12, material: 'steel' }) },
    { sku: 'HT-CHISEL-SET', name: 'Wood Chisel Set (4-Piece)', description: 'Chrome vanadium chisels: 1/4", 1/2", 3/4", 1".', category: 'hand-tools', price: 24.99, stock: 25, aisle: 'A2', bin: '18', tags: JSON.stringify(['chisel', 'woodworking', 'set']), attributes: JSON.stringify({ pieces: 4, material: 'chrome vanadium' }) },

    // POWER TOOLS (16-30)
    { sku: 'PT-DRILL-20V', name: '20V Cordless Drill/Driver', description: 'Variable speed drill with lithium-ion battery and charger.', category: 'power-tools', price: 89.99, stock: 24, aisle: 'B1', bin: '1', tags: JSON.stringify(['drill', 'cordless', 'battery']), attributes: JSON.stringify({ voltage: 20, battery: 'lithium-ion' }) },
    { sku: 'PT-IMPACT-20V', name: '20V Cordless Impact Driver', description: '1500 in-lbs torque impact driver. Battery sold separately.', category: 'power-tools', price: 79.99, stock: 20, aisle: 'B1', bin: '3', tags: JSON.stringify(['impact', 'cordless', 'driver']), attributes: JSON.stringify({ voltage: 20, torque_in_lbs: 1500 }) },
    { sku: 'PT-CIRC-SAW-7', name: '7-1/4" Circular Saw 15A', description: 'Corded circular saw with laser guide. Includes blade.', category: 'power-tools', price: 79.99, stock: 15, aisle: 'B1', bin: '6', tags: JSON.stringify(['saw', 'circular', 'corded']), attributes: JSON.stringify({ blade_in: 7.25, amps: 15 }) },
    { sku: 'PT-JIG-SAW', name: 'Variable Speed Jigsaw', description: 'Corded jigsaw with orbital action and dust blower.', category: 'power-tools', price: 59.99, stock: 18, aisle: 'B1', bin: '8', tags: JSON.stringify(['saw', 'jigsaw', 'cutting']), attributes: JSON.stringify({ amps: 6, orbital: true }) },
    { sku: 'PT-RECIP-SAW', name: 'Reciprocating Saw 12A', description: 'Corded recip saw for demolition and remodeling.', category: 'power-tools', price: 69.99, stock: 14, aisle: 'B1', bin: '10', tags: JSON.stringify(['saw', 'reciprocating', 'demolition']), attributes: JSON.stringify({ amps: 12, stroke_length: 1.125 }) },
    { sku: 'PT-SANDER-ORBIT', name: 'Random Orbital Sander 5"', description: 'Variable speed palm sander with dust collection.', category: 'power-tools', price: 49.99, stock: 22, aisle: 'B1', bin: '12', tags: JSON.stringify(['sander', 'orbital', 'finishing']), attributes: JSON.stringify({ pad_in: 5, dust_collection: true }) },
    { sku: 'PT-GRINDER-4.5', name: 'Angle Grinder 4-1/2"', description: '11 amp grinder for cutting and grinding metal.', category: 'power-tools', price: 44.99, stock: 26, aisle: 'B1', bin: '14', tags: JSON.stringify(['grinder', 'angle', 'metal']), attributes: JSON.stringify({ disc_in: 4.5, amps: 11 }) },
    { sku: 'PT-ROUTER-HP', name: 'Fixed Base Router 2.25 HP', description: 'Variable speed router with soft start.', category: 'power-tools', price: 129.99, stock: 10, aisle: 'B1', bin: '16', tags: JSON.stringify(['router', 'woodworking', 'fixed']), attributes: JSON.stringify({ hp: 2.25, variable_speed: true }) },
    { sku: 'PT-MITER-SAW-10', name: '10" Compound Miter Saw', description: 'Sliding compound miter saw for crosscuts and angles.', category: 'power-tools', price: 249.99, stock: 8, aisle: 'B2', bin: '1', tags: JSON.stringify(['saw', 'miter', 'compound']), attributes: JSON.stringify({ blade_in: 10, sliding: true }) },
    { sku: 'PT-TABLE-SAW-10', name: '10" Jobsite Table Saw', description: 'Portable table saw with folding stand. 15 amp motor.', category: 'power-tools', price: 349.99, stock: 6, aisle: 'B2', bin: '5', tags: JSON.stringify(['saw', 'table', 'jobsite']), attributes: JSON.stringify({ blade_in: 10, amps: 15 }) },
    { sku: 'PT-DRILL-BITS-29', name: 'Drill Bit Set (29-Piece)', description: 'Titanium coated HSS bits from 1/16" to 1/2".', category: 'power-tools', price: 34.99, stock: 35, aisle: 'B2', bin: '10', tags: JSON.stringify(['drill', 'bits', 'titanium']), attributes: JSON.stringify({ pieces: 29, coating: 'titanium' }) },
    { sku: 'PT-BLADE-CIRC-7', name: '7-1/4" Carbide Saw Blade 24T', description: 'General purpose framing blade for circular saws.', category: 'power-tools', price: 12.99, stock: 50, aisle: 'B2', bin: '12', tags: JSON.stringify(['blade', 'circular', 'carbide']), attributes: JSON.stringify({ diameter_in: 7.25, teeth: 24 }) },
    { sku: 'PT-SAND-DISC-50', name: 'Sanding Discs 5" Assorted (50-Pack)', description: 'Hook and loop discs: 60, 80, 120, 220 grit.', category: 'power-tools', price: 14.99, stock: 45, aisle: 'B2', bin: '14', tags: JSON.stringify(['sanding', 'discs', 'assorted']), attributes: JSON.stringify({ pieces: 50, diameter_in: 5 }) },
    { sku: 'PT-BATTERY-20V', name: '20V Lithium-Ion Battery 4.0Ah', description: 'Compatible with all 20V tools. LED charge indicator.', category: 'power-tools', price: 59.99, stock: 30, aisle: 'B2', bin: '16', tags: JSON.stringify(['battery', 'lithium', '20V']), attributes: JSON.stringify({ voltage: 20, amp_hours: 4.0 }) },
    { sku: 'PT-CHARGER-20V', name: '20V Fast Charger', description: 'Charges 20V batteries in 1 hour.', category: 'power-tools', price: 39.99, stock: 25, aisle: 'B2', bin: '17', tags: JSON.stringify(['charger', '20V', 'fast']), attributes: JSON.stringify({ voltage: 20, charge_time_hrs: 1 }) },

    // PLUMBING (31-45)
    { sku: 'PL-PIPE-PVC-1', name: 'PVC Pipe 1" x 10ft Schedule 40', description: 'White PVC pipe for drain and vent applications.', category: 'plumbing', price: 6.99, stock: 100, aisle: 'C1', bin: '1', tags: JSON.stringify(['PVC', 'pipe', 'drain']), attributes: JSON.stringify({ diameter_in: 1, length_ft: 10, schedule: 40 }) },
    { sku: 'PL-PIPE-PVC-2', name: 'PVC Pipe 2" x 10ft Schedule 40', description: 'White PVC pipe for drain lines.', category: 'plumbing', price: 9.99, stock: 80, aisle: 'C1', bin: '2', tags: JSON.stringify(['PVC', 'pipe', 'drain']), attributes: JSON.stringify({ diameter_in: 2, length_ft: 10, schedule: 40 }) },
    { sku: 'PL-ELBOW-PVC-2', name: 'PVC 90° Elbow 2"', description: 'Schedule 40 slip elbow fitting.', category: 'plumbing', price: 2.49, stock: 150, aisle: 'C1', bin: '5', tags: JSON.stringify(['PVC', 'fitting', 'elbow']), attributes: JSON.stringify({ diameter_in: 2, angle: 90 }) },
    { sku: 'PL-TEE-PVC-2', name: 'PVC Tee 2"', description: 'Schedule 40 slip tee fitting.', category: 'plumbing', price: 3.49, stock: 120, aisle: 'C1', bin: '6', tags: JSON.stringify(['PVC', 'fitting', 'tee']), attributes: JSON.stringify({ diameter_in: 2, type: 'tee' }) },
    { sku: 'PL-CEMENT-PVC', name: 'PVC Cement 8oz', description: 'Medium body cement for PVC pipe and fittings.', category: 'plumbing', price: 6.99, stock: 60, aisle: 'C1', bin: '10', tags: JSON.stringify(['cement', 'PVC', 'adhesive']), attributes: JSON.stringify({ size_oz: 8, type: 'medium' }) },
    { sku: 'PL-PRIMER-PUR', name: 'Purple Primer 8oz', description: 'PVC primer for cleaning and preparing pipe.', category: 'plumbing', price: 5.99, stock: 55, aisle: 'C1', bin: '11', tags: JSON.stringify(['primer', 'PVC', 'preparation']), attributes: JSON.stringify({ size_oz: 8, color: 'purple' }) },
    { sku: 'PL-TEFLON-TAPE', name: 'Teflon Tape 1/2" x 520"', description: 'PTFE thread seal tape for threaded connections.', category: 'plumbing', price: 2.99, stock: 200, aisle: 'C1', bin: '14', tags: JSON.stringify(['tape', 'teflon', 'sealant']), attributes: JSON.stringify({ width_in: 0.5, length_in: 520 }) },
    { sku: 'PL-SUPPLY-LINE-12', name: 'Braided Stainless Supply Line 12"', description: 'Flexible supply line for faucets and toilets.', category: 'plumbing', price: 8.99, stock: 75, aisle: 'C2', bin: '1', tags: JSON.stringify(['supply', 'stainless', 'flexible']), attributes: JSON.stringify({ length_in: 12, material: 'stainless' }) },
    { sku: 'PL-VALVE-SHUT-1/2', name: 'Ball Valve Shut-Off 1/2"', description: 'Quarter turn brass ball valve.', category: 'plumbing', price: 9.99, stock: 45, aisle: 'C2', bin: '4', tags: JSON.stringify(['valve', 'shutoff', 'brass']), attributes: JSON.stringify({ diameter_in: 0.5, material: 'brass' }) },
    { sku: 'PL-FAUCET-KIT', name: 'Kitchen Faucet Single Handle', description: 'Chrome finish single handle pull-down faucet.', category: 'plumbing', price: 89.99, stock: 15, aisle: 'C2', bin: '8', tags: JSON.stringify(['faucet', 'kitchen', 'chrome']), attributes: JSON.stringify({ handles: 1, finish: 'chrome' }) },
    { sku: 'PL-TOILET-WAX', name: 'Toilet Wax Ring with Horn', description: 'Extra thick wax ring for toilet installation.', category: 'plumbing', price: 4.99, stock: 65, aisle: 'C2', bin: '12', tags: JSON.stringify(['toilet', 'wax', 'seal']), attributes: JSON.stringify({ type: 'with horn', extra_thick: true }) },
    { sku: 'PL-DRAIN-CLR-32', name: 'Drain Cleaner 32oz', description: 'Professional strength liquid drain opener.', category: 'plumbing', price: 8.99, stock: 50, aisle: 'C2', bin: '15', tags: JSON.stringify(['drain', 'cleaner', 'chemical']), attributes: JSON.stringify({ size_oz: 32, type: 'liquid' }) },
    { sku: 'PL-PLUNGER-HD', name: 'Heavy Duty Toilet Plunger', description: 'Flange plunger with extended rubber cup.', category: 'plumbing', price: 12.99, stock: 40, aisle: 'C2', bin: '18', tags: JSON.stringify(['plunger', 'toilet', 'flange']), attributes: JSON.stringify({ type: 'flange', heavy_duty: true }) },
    { sku: 'PL-SNAKE-25', name: 'Drain Snake 25ft', description: 'Manual drain auger for clearing clogs.', category: 'plumbing', price: 24.99, stock: 25, aisle: 'C3', bin: '1', tags: JSON.stringify(['snake', 'auger', 'drain']), attributes: JSON.stringify({ length_ft: 25, manual: true }) },
    { sku: 'PL-WRENCH-PIPE-14', name: 'Pipe Wrench 14"', description: 'Heavy duty adjustable pipe wrench.', category: 'plumbing', price: 22.99, stock: 30, aisle: 'C3', bin: '4', tags: JSON.stringify(['wrench', 'pipe', 'plumbing']), attributes: JSON.stringify({ length_in: 14, jaw_capacity: 2 }) },

    // ELECTRICAL (46-60)
    { sku: 'EL-WIRE-14-50', name: '14/2 NM-B Wire 50ft', description: 'Romex wire for 15 amp circuits. White sheathing.', category: 'electrical', price: 34.99, stock: 40, aisle: 'D1', bin: '1', tags: JSON.stringify(['wire', 'romex', '14AWG']), attributes: JSON.stringify({ gauge: 14, conductors: 2, length_ft: 50 }) },
    { sku: 'EL-WIRE-12-50', name: '12/2 NM-B Wire 50ft', description: 'Romex wire for 20 amp circuits. Yellow sheathing.', category: 'electrical', price: 44.99, stock: 35, aisle: 'D1', bin: '2', tags: JSON.stringify(['wire', 'romex', '12AWG']), attributes: JSON.stringify({ gauge: 12, conductors: 2, length_ft: 50 }) },
    { sku: 'EL-OUTLET-15A', name: 'Duplex Outlet 15A', description: 'Standard 3-prong outlet. White.', category: 'electrical', price: 1.29, stock: 300, aisle: 'D1', bin: '5', tags: JSON.stringify(['outlet', 'receptacle', '15A']), attributes: JSON.stringify({ amps: 15, color: 'white' }) },
    { sku: 'EL-OUTLET-20A', name: 'Duplex Outlet 20A', description: 'Commercial grade 20 amp outlet. White.', category: 'electrical', price: 3.99, stock: 150, aisle: 'D1', bin: '6', tags: JSON.stringify(['outlet', 'receptacle', '20A']), attributes: JSON.stringify({ amps: 20, color: 'white' }) },
    { sku: 'EL-GFCI-15A', name: 'GFCI Outlet 15A', description: 'Ground fault outlet with test/reset buttons. Required for bathrooms and kitchens.', category: 'electrical', price: 14.99, stock: 80, aisle: 'D1', bin: '8', tags: JSON.stringify(['GFCI', 'outlet', 'safety']), attributes: JSON.stringify({ amps: 15, type: 'GFCI' }) },
    { sku: 'EL-SWITCH-SP', name: 'Single Pole Light Switch', description: 'Standard toggle light switch. White.', category: 'electrical', price: 1.49, stock: 250, aisle: 'D1', bin: '12', tags: JSON.stringify(['switch', 'toggle', 'single-pole']), attributes: JSON.stringify({ poles: 1, color: 'white' }) },
    { sku: 'EL-SWITCH-3WAY', name: '3-Way Light Switch', description: 'For controlling lights from two locations.', category: 'electrical', price: 4.99, stock: 100, aisle: 'D1', bin: '13', tags: JSON.stringify(['switch', 'toggle', '3-way']), attributes: JSON.stringify({ poles: 3, color: 'white' }) },
    { sku: 'EL-DIMMER-LED', name: 'LED Dimmer Switch', description: 'Compatible with LED and incandescent bulbs.', category: 'electrical', price: 19.99, stock: 60, aisle: 'D1', bin: '15', tags: JSON.stringify(['dimmer', 'LED', 'switch']), attributes: JSON.stringify({ LED_compatible: true, wattage: 600 }) },
    { sku: 'EL-BOX-1GANG', name: 'Electrical Box 1-Gang Old Work', description: 'Plastic old work box for existing walls.', category: 'electrical', price: 2.49, stock: 180, aisle: 'D2', bin: '1', tags: JSON.stringify(['box', 'old-work', '1-gang']), attributes: JSON.stringify({ gangs: 1, type: 'old work' }) },
    { sku: 'EL-BOX-2GANG', name: 'Electrical Box 2-Gang Old Work', description: 'Plastic old work box for double switches/outlets.', category: 'electrical', price: 3.99, stock: 120, aisle: 'D2', bin: '2', tags: JSON.stringify(['box', 'old-work', '2-gang']), attributes: JSON.stringify({ gangs: 2, type: 'old work' }) },
    { sku: 'EL-COVER-1G', name: 'Wall Plate 1-Gang White', description: 'Standard outlet or switch cover plate.', category: 'electrical', price: 0.79, stock: 400, aisle: 'D2', bin: '5', tags: JSON.stringify(['cover', 'plate', '1-gang']), attributes: JSON.stringify({ gangs: 1, color: 'white' }) },
    { sku: 'EL-BREAKER-15', name: 'Circuit Breaker 15A Single Pole', description: 'Standard 15 amp breaker. Check panel compatibility.', category: 'electrical', price: 6.99, stock: 80, aisle: 'D2', bin: '10', tags: JSON.stringify(['breaker', 'circuit', '15A']), attributes: JSON.stringify({ amps: 15, poles: 1 }) },
    { sku: 'EL-BREAKER-20', name: 'Circuit Breaker 20A Single Pole', description: 'Standard 20 amp breaker. Check panel compatibility.', category: 'electrical', price: 7.99, stock: 70, aisle: 'D2', bin: '11', tags: JSON.stringify(['breaker', 'circuit', '20A']), attributes: JSON.stringify({ amps: 20, poles: 1 }) },
    { sku: 'EL-TESTER-VOLT', name: 'Non-Contact Voltage Tester', description: 'Detects AC voltage from 50V to 1000V. LED and beep alerts.', category: 'electrical', price: 19.99, stock: 45, aisle: 'D2', bin: '15', tags: JSON.stringify(['tester', 'voltage', 'safety']), attributes: JSON.stringify({ range_v: '50-1000', non_contact: true }) },
    { sku: 'EL-TAPE-BLACK', name: 'Electrical Tape Black 3/4" x 60ft', description: 'Vinyl electrical tape for insulation.', category: 'electrical', price: 3.49, stock: 150, aisle: 'D2', bin: '18', tags: JSON.stringify(['tape', 'electrical', 'insulation']), attributes: JSON.stringify({ width_in: 0.75, length_ft: 60 }) },

    // PAINT (61-72)
    { sku: 'PA-INT-GAL-WHITE', name: 'Interior Paint Flat White 1 Gal', description: 'Premium interior latex paint. Low VOC.', category: 'paint', price: 34.99, stock: 60, aisle: 'E1', bin: '1', tags: JSON.stringify(['paint', 'interior', 'flat']), attributes: JSON.stringify({ size_gal: 1, finish: 'flat', base: 'white' }) },
    { sku: 'PA-INT-GAL-EGGSHELL', name: 'Interior Paint Eggshell Tint Base 1 Gal', description: 'Tintable eggshell finish. Washable.', category: 'paint', price: 38.99, stock: 50, aisle: 'E1', bin: '3', tags: JSON.stringify(['paint', 'interior', 'eggshell']), attributes: JSON.stringify({ size_gal: 1, finish: 'eggshell', tintable: true }) },
    { sku: 'PA-EXT-GAL-SATIN', name: 'Exterior Paint Satin White 1 Gal', description: 'Acrylic latex exterior paint. Mildew resistant.', category: 'paint', price: 42.99, stock: 40, aisle: 'E1', bin: '6', tags: JSON.stringify(['paint', 'exterior', 'satin']), attributes: JSON.stringify({ size_gal: 1, finish: 'satin', mildew_resistant: true }) },
    { sku: 'PA-PRIMER-GAL', name: 'Primer Sealer White 1 Gal', description: 'Interior/exterior primer for all surfaces.', category: 'paint', price: 29.99, stock: 55, aisle: 'E1', bin: '10', tags: JSON.stringify(['primer', 'sealer', 'all-purpose']), attributes: JSON.stringify({ size_gal: 1, interior_exterior: true }) },
    { sku: 'PA-ROLLER-9', name: 'Paint Roller Cover 9" 3/8" Nap', description: 'Medium nap roller for smooth to semi-smooth surfaces.', category: 'paint', price: 6.99, stock: 100, aisle: 'E2', bin: '1', tags: JSON.stringify(['roller', 'cover', 'medium']), attributes: JSON.stringify({ length_in: 9, nap_in: 0.375 }) },
    { sku: 'PA-ROLLER-FRAME', name: 'Paint Roller Frame 9"', description: 'Standard roller frame with threaded handle.', category: 'paint', price: 5.99, stock: 80, aisle: 'E2', bin: '2', tags: JSON.stringify(['roller', 'frame', 'standard']), attributes: JSON.stringify({ length_in: 9, threaded: true }) },
    { sku: 'PA-BRUSH-2', name: 'Paint Brush 2" Angle', description: 'Nylon/polyester blend for latex paints.', category: 'paint', price: 7.99, stock: 90, aisle: 'E2', bin: '5', tags: JSON.stringify(['brush', 'angle', 'latex']), attributes: JSON.stringify({ width_in: 2, type: 'angle' }) },
    { sku: 'PA-BRUSH-4', name: 'Paint Brush 4" Flat', description: 'Professional quality brush for large surfaces.', category: 'paint', price: 12.99, stock: 60, aisle: 'E2', bin: '6', tags: JSON.stringify(['brush', 'flat', 'professional']), attributes: JSON.stringify({ width_in: 4, type: 'flat' }) },
    { sku: 'PA-TRAY-LINER', name: 'Paint Tray Liner (5-Pack)', description: 'Disposable liners for 9" roller trays.', category: 'paint', price: 5.99, stock: 120, aisle: 'E2', bin: '10', tags: JSON.stringify(['tray', 'liner', 'disposable']), attributes: JSON.stringify({ count: 5, size_in: 9 }) },
    { sku: 'PA-TAPE-BLUE', name: 'Painters Tape Blue 1.88" x 60yd', description: '14-day clean removal. Sharp paint lines.', category: 'paint', price: 7.99, stock: 150, aisle: 'E2', bin: '12', tags: JSON.stringify(['tape', 'painters', 'masking']), attributes: JSON.stringify({ width_in: 1.88, length_yd: 60 }) },
    { sku: 'PA-DROP-CLOTH', name: 'Canvas Drop Cloth 9x12 ft', description: 'Heavy duty canvas for floor protection.', category: 'paint', price: 24.99, stock: 35, aisle: 'E2', bin: '15', tags: JSON.stringify(['drop cloth', 'canvas', 'protection']), attributes: JSON.stringify({ width_ft: 9, length_ft: 12 }) },
    { sku: 'PA-CAULK-WHITE', name: 'Painters Caulk White 10.1oz', description: 'Paintable acrylic latex caulk for gaps and cracks.', category: 'paint', price: 4.99, stock: 100, aisle: 'E2', bin: '18', tags: JSON.stringify(['caulk', 'paintable', 'acrylic']), attributes: JSON.stringify({ size_oz: 10.1, paintable: true }) },

    // LUMBER & BUILDING (73-82)
    { sku: 'LU-2X4-8-SPF', name: '2x4x8 SPF Stud', description: 'Spruce-Pine-Fir framing lumber. Kiln dried.', category: 'lumber', price: 5.49, stock: 200, aisle: 'F1', bin: '1', tags: JSON.stringify(['lumber', '2x4', 'framing']), attributes: JSON.stringify({ width_in: 1.5, height_in: 3.5, length_ft: 8 }) },
    { sku: 'LU-2X6-8-SPF', name: '2x6x8 SPF', description: 'Spruce-Pine-Fir for framing and structural use.', category: 'lumber', price: 8.49, stock: 150, aisle: 'F1', bin: '3', tags: JSON.stringify(['lumber', '2x6', 'structural']), attributes: JSON.stringify({ width_in: 1.5, height_in: 5.5, length_ft: 8 }) },
    { sku: 'LU-PLY-1/2-4X8', name: 'Plywood 1/2" 4x8 BC', description: 'BC grade sanded plywood for sheathing and subfloor.', category: 'lumber', price: 42.99, stock: 60, aisle: 'F2', bin: '1', tags: JSON.stringify(['plywood', 'sheathing', 'BC']), attributes: JSON.stringify({ thickness_in: 0.5, width_ft: 4, length_ft: 8 }) },
    { sku: 'LU-PLY-3/4-4X8', name: 'Plywood 3/4" 4x8 BC', description: 'BC grade sanded plywood for subfloor and shelving.', category: 'lumber', price: 56.99, stock: 45, aisle: 'F2', bin: '2', tags: JSON.stringify(['plywood', 'subfloor', 'BC']), attributes: JSON.stringify({ thickness_in: 0.75, width_ft: 4, length_ft: 8 }) },
    { sku: 'LU-OSB-7/16-4X8', name: 'OSB 7/16" 4x8', description: 'Oriented strand board for wall and roof sheathing.', category: 'lumber', price: 18.99, stock: 80, aisle: 'F2', bin: '5', tags: JSON.stringify(['OSB', 'sheathing', 'structural']), attributes: JSON.stringify({ thickness_in: 0.4375, width_ft: 4, length_ft: 8 }) },
    { sku: 'LU-DRYWALL-1/2-4X8', name: 'Drywall 1/2" 4x8', description: 'Standard gypsum board for walls and ceilings.', category: 'lumber', price: 14.99, stock: 100, aisle: 'F3', bin: '1', tags: JSON.stringify(['drywall', 'gypsum', 'wallboard']), attributes: JSON.stringify({ thickness_in: 0.5, width_ft: 4, length_ft: 8 }) },
    { sku: 'LU-DRYWALL-MR', name: 'Drywall Moisture Resistant 1/2" 4x8', description: 'Green board for bathrooms and high humidity areas.', category: 'lumber', price: 18.99, stock: 60, aisle: 'F3', bin: '3', tags: JSON.stringify(['drywall', 'moisture', 'bathroom']), attributes: JSON.stringify({ thickness_in: 0.5, moisture_resistant: true }) },
    { sku: 'LU-INSUL-R13', name: 'Fiberglass Insulation R-13 15" x 32ft', description: 'Kraft faced insulation for 2x4 walls.', category: 'lumber', price: 24.99, stock: 40, aisle: 'F4', bin: '1', tags: JSON.stringify(['insulation', 'fiberglass', 'R-13']), attributes: JSON.stringify({ r_value: 13, width_in: 15, length_ft: 32 }) },
    { sku: 'LU-INSUL-R19', name: 'Fiberglass Insulation R-19 15" x 39ft', description: 'Kraft faced insulation for 2x6 walls and floors.', category: 'lumber', price: 32.99, stock: 35, aisle: 'F4', bin: '2', tags: JSON.stringify(['insulation', 'fiberglass', 'R-19']), attributes: JSON.stringify({ r_value: 19, width_in: 15, length_ft: 39 }) },
    { sku: 'LU-CEMENT-BAG', name: 'Portland Cement 94lb Bag', description: 'Type I/II portland cement for concrete and mortar.', category: 'lumber', price: 14.99, stock: 50, aisle: 'F5', bin: '1', tags: JSON.stringify(['cement', 'concrete', 'mortar']), attributes: JSON.stringify({ weight_lb: 94, type: 'Type I/II' }) },

    // FASTENERS (83-92)
    { sku: 'FA-NAIL-16D-1LB', name: 'Common Nails 16d 1lb Box', description: '3-1/2" bright common nails for framing.', category: 'fasteners', price: 6.99, stock: 100, aisle: 'G1', bin: '1', tags: JSON.stringify(['nails', 'common', '16d']), attributes: JSON.stringify({ size: '16d', length_in: 3.5, weight_lb: 1 }) },
    { sku: 'FA-NAIL-8D-1LB', name: 'Common Nails 8d 1lb Box', description: '2-1/2" bright common nails for general use.', category: 'fasteners', price: 5.99, stock: 120, aisle: 'G1', bin: '2', tags: JSON.stringify(['nails', 'common', '8d']), attributes: JSON.stringify({ size: '8d', length_in: 2.5, weight_lb: 1 }) },
    { sku: 'FA-SCREW-DECK-1LB', name: 'Deck Screws #8 x 2-1/2" 1lb', description: 'Coated deck screws. Star drive.', category: 'fasteners', price: 12.99, stock: 80, aisle: 'G1', bin: '5', tags: JSON.stringify(['screws', 'deck', 'coated']), attributes: JSON.stringify({ size: '#8', length_in: 2.5, drive: 'star' }) },
    { sku: 'FA-SCREW-DRYWALL-1LB', name: 'Drywall Screws #6 x 1-5/8" 1lb', description: 'Coarse thread drywall screws. Phillips drive.', category: 'fasteners', price: 7.99, stock: 150, aisle: 'G1', bin: '8', tags: JSON.stringify(['screws', 'drywall', 'coarse']), attributes: JSON.stringify({ size: '#6', length_in: 1.625, thread: 'coarse' }) },
    { sku: 'FA-SCREW-WOOD-100', name: 'Wood Screws #8 x 1-1/4" (100-Pack)', description: 'Yellow zinc flat head wood screws.', category: 'fasteners', price: 8.99, stock: 90, aisle: 'G1', bin: '10', tags: JSON.stringify(['screws', 'wood', 'zinc']), attributes: JSON.stringify({ size: '#8', length_in: 1.25, count: 100 }) },
    { sku: 'FA-BOLT-HEX-10', name: 'Hex Bolts 1/4"-20 x 2" (10-Pack)', description: 'Grade 5 zinc plated hex bolts.', category: 'fasteners', price: 4.99, stock: 100, aisle: 'G2', bin: '1', tags: JSON.stringify(['bolts', 'hex', 'grade5']), attributes: JSON.stringify({ size: '1/4-20', length_in: 2, count: 10 }) },
    { sku: 'FA-NUT-HEX-20', name: 'Hex Nuts 1/4"-20 (20-Pack)', description: 'Zinc plated hex nuts.', category: 'fasteners', price: 2.99, stock: 150, aisle: 'G2', bin: '2', tags: JSON.stringify(['nuts', 'hex', 'zinc']), attributes: JSON.stringify({ size: '1/4-20', count: 20 }) },
    { sku: 'FA-WASHER-FLAT-25', name: 'Flat Washers 1/4" (25-Pack)', description: 'Zinc plated flat washers.', category: 'fasteners', price: 2.49, stock: 180, aisle: 'G2', bin: '3', tags: JSON.stringify(['washers', 'flat', 'zinc']), attributes: JSON.stringify({ size: '1/4"', count: 25 }) },
    { sku: 'FA-ANCHOR-TOGGLE-10', name: 'Toggle Bolts 1/4" x 3" (10-Pack)', description: 'Heavy duty toggle bolts for hollow walls.', category: 'fasteners', price: 9.99, stock: 60, aisle: 'G2', bin: '8', tags: JSON.stringify(['anchors', 'toggle', 'hollow-wall']), attributes: JSON.stringify({ size: '1/4"', length_in: 3, count: 10 }) },
    { sku: 'FA-ANCHOR-CONCRETE-10', name: 'Concrete Wedge Anchors 3/8" x 3" (10-Pack)', description: 'Zinc plated wedge anchors for concrete.', category: 'fasteners', price: 11.99, stock: 50, aisle: 'G2', bin: '10', tags: JSON.stringify(['anchors', 'wedge', 'concrete']), attributes: JSON.stringify({ size: '3/8"', length_in: 3, count: 10 }) },

    // SAFETY & MISC (93-100)
    { sku: 'SA-GOGGLES-CLEAR', name: 'Safety Goggles Clear', description: 'Anti-fog lens with indirect ventilation.', category: 'safety', price: 8.99, stock: 75, aisle: 'H1', bin: '1', tags: JSON.stringify(['safety', 'goggles', 'eye-protection']), attributes: JSON.stringify({ lens: 'clear', anti_fog: true }) },
    { sku: 'SA-GLOVES-LEATHER', name: 'Leather Work Gloves Large', description: 'Split cowhide palm with safety cuff.', category: 'safety', price: 14.99, stock: 60, aisle: 'H1', bin: '5', tags: JSON.stringify(['gloves', 'leather', 'work']), attributes: JSON.stringify({ material: 'leather', size: 'large' }) },
    { sku: 'SA-MASK-N95-10', name: 'N95 Respirator Masks (10-Pack)', description: 'NIOSH approved particulate respirators.', category: 'safety', price: 19.99, stock: 100, aisle: 'H1', bin: '8', tags: JSON.stringify(['mask', 'N95', 'respirator']), attributes: JSON.stringify({ count: 10, rating: 'N95' }) },
    { sku: 'SA-EARPLUGS-10', name: 'Foam Ear Plugs (10-Pair)', description: 'NRR 32dB disposable foam ear plugs.', category: 'safety', price: 5.99, stock: 120, aisle: 'H1', bin: '10', tags: JSON.stringify(['ear', 'plugs', 'hearing']), attributes: JSON.stringify({ count: 10, nrr: 32 }) },
    { sku: 'SA-VEST-HI-VIS', name: 'High Visibility Safety Vest', description: 'Class 2 mesh vest with reflective strips.', category: 'safety', price: 12.99, stock: 45, aisle: 'H1', bin: '12', tags: JSON.stringify(['vest', 'hi-vis', 'reflective']), attributes: JSON.stringify({ class: 2, mesh: true }) },
    { sku: 'SA-FIRST-AID-KIT', name: 'First Aid Kit 100-Piece', description: 'Portable kit with bandages, gauze, and antiseptic.', category: 'safety', price: 24.99, stock: 30, aisle: 'H1', bin: '15', tags: JSON.stringify(['first-aid', 'kit', 'medical']), attributes: JSON.stringify({ pieces: 100, portable: true }) },
    { sku: 'SA-FIRE-EXT-ABC', name: 'Fire Extinguisher ABC 2.5lb', description: 'Multipurpose dry chemical extinguisher with bracket.', category: 'safety', price: 29.99, stock: 25, aisle: 'H1', bin: '18', tags: JSON.stringify(['fire', 'extinguisher', 'ABC']), attributes: JSON.stringify({ weight_lb: 2.5, type: 'ABC' }) },
    { sku: 'AD-GORILLA-4OZ', name: 'Gorilla Glue Original 4oz', description: 'Waterproof polyurethane adhesive. Expands 3x.', category: 'adhesives', price: 7.99, stock: 85, aisle: 'A4', bin: '1', tags: JSON.stringify(['glue', 'waterproof', 'polyurethane']), attributes: JSON.stringify({ size_oz: 4, waterproof: true }) },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku_storeId: { sku: product.sku, storeId: store.id } },
      update: product,
      create: { ...product, storeId: store.id },
    })
  }
  console.log('✓ Products created:', products.length)

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
