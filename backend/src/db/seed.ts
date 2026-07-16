import { db } from './client'
import { randomUUID } from 'crypto'

type GeomSeed =
  | { name: string; category: string; type: 'Point';      coordinates: [number, number] }
  | { name: string; category: string; type: 'LineString'; coordinates: [number, number][] }
  | { name: string; category: string; type: 'Polygon';    coordinates: [number, number][][] }

const locations: GeomSeed[] = [
  { name: 'มหาวิทยาลัยขอนแก่น',            type: 'Point',      category: 'มหาวิทยาลัย', coordinates: [102.8222, 16.4746] },
  { name: 'วัดพระแก้ว',                     type: 'Point',      category: 'วัด',          coordinates: [100.4913, 13.7500] },
  { name: 'สนามบินสุวรรณภูมิ',               type: 'Point',      category: 'สนามบิน',      coordinates: [100.7472, 13.6900] },
  { name: 'อุทยานแห่งชาติดอยอินทนนท์',       type: 'Point',      category: 'อุทยาน',       coordinates: [98.4869, 18.5893]  },
  { name: 'หาดป่าตอง',                      type: 'Point',      category: 'หาด',          coordinates: [98.2976, 7.8959]   },
  { name: 'มหาวิทยาลัยเชียงใหม่',            type: 'Point',      category: 'มหาวิทยาลัย', coordinates: [98.9536, 18.8022]  },
  { name: 'ตลาดนัดจตุจักร',                 type: 'Point',      category: 'ตลาด',         coordinates: [100.5508, 13.7999] },
  { name: 'วัดอรุณราชวรารามราชวรมหาวิหาร',   type: 'Point',      category: 'วัด',          coordinates: [100.4888, 13.7437] },
  { name: 'สนามบินดอนเมือง',                type: 'Point',      category: 'สนามบิน',      coordinates: [100.6067, 13.9126] },
  { name: 'เขาหลวง อุทยานแห่งชาติรามคำแหง', type: 'Point',      category: 'อุทยาน',       coordinates: [99.5241, 17.0291]  },
  { name: 'ถนนสีลม',                        type: 'LineString', category: 'ทั่วไป',        coordinates: [[100.5220,13.7218],[100.5285,13.7241],[100.5340,13.7260],[100.5390,13.7275]] },
  { name: 'สวนลุมพินี',                     type: 'Polygon',    category: 'อุทยาน',        coordinates: [[[100.5404,13.7290],[100.5454,13.7290],[100.5454,13.7330],[100.5404,13.7330],[100.5404,13.7290]]] },
]

const count = db.query<{ c: number }, []>('SELECT COUNT(*) as c FROM features').get()
if (count && count.c === 0) {
  try {
    db.run('BEGIN')
    for (const loc of locations) {
      db.run(
        `INSERT INTO features (id, name, category, geometry_type, coordinates) VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), loc.name, loc.category, loc.type, JSON.stringify(loc.coordinates)]
      )
    }
    db.run('COMMIT')
    console.log(`Seeded ${locations.length} Thai locations`)
  } catch (err) {
    db.run('ROLLBACK')
    console.error('[seed] Seeding failed, rolled back:', err)
    process.exit(1)
  }
}
