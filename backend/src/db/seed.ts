import { db } from './client'
import { randomUUID } from 'crypto'

const locations = [
  { name: 'มหาวิทยาลัยขอนแก่น',            category: 'มหาวิทยาลัย', coordinates: [102.8222, 16.4746] },
  { name: 'วัดพระแก้ว',                     category: 'วัด',          coordinates: [100.4913, 13.7500] },
  { name: 'สนามบินสุวรรณภูมิ',               category: 'สนามบิน',      coordinates: [100.7472, 13.6900] },
  { name: 'อุทยานแห่งชาติดอยอินทนนท์',       category: 'อุทยาน',       coordinates: [98.4869, 18.5893]  },
  { name: 'หาดป่าตอง',                      category: 'หาด',          coordinates: [98.2976, 7.8959]   },
  { name: 'มหาวิทยาลัยเชียงใหม่',            category: 'มหาวิทยาลัย', coordinates: [98.9536, 18.8022]  },
  { name: 'ตลาดนัดจตุจักร',                 category: 'ตลาด',         coordinates: [100.5508, 13.7999] },
  { name: 'วัดอรุณราชวรารามราชวรมหาวิหาร',   category: 'วัด',          coordinates: [100.4888, 13.7437] },
  { name: 'สนามบินดอนเมือง',                category: 'สนามบิน',      coordinates: [100.6067, 13.9126] },
  { name: 'เขาหลวง อุทยานแห่งชาติรามคำแหง', category: 'อุทยาน',       coordinates: [99.5241, 17.0291]  },
]

const count = db.query<{ c: number }, []>('SELECT COUNT(*) as c FROM features').get()
if (count && count.c === 0) {
  try {
    db.run('BEGIN')
    for (const loc of locations) {
      db.run(
        `INSERT INTO features (id, name, category, geometry_type, coordinates) VALUES (?, ?, ?, 'Point', ?)`,
        [randomUUID(), loc.name, loc.category, JSON.stringify(loc.coordinates)]
      )
    }
    db.run('COMMIT')
    console.log('Seeded 10 Thai locations')
  } catch (err) {
    db.run('ROLLBACK')
    console.error('[seed] Seeding failed, rolled back:', err)
    process.exit(1)
  }
}
