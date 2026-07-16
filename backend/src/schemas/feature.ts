import { z } from 'zod'

const PointCoords = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
const LineCoords  = z.array(PointCoords).min(2)
const RingCoords  = z.array(PointCoords).min(4)

export const GeometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Point'),      coordinates: PointCoords }),
  z.object({ type: z.literal('LineString'), coordinates: LineCoords }),
  z.object({ type: z.literal('Polygon'),    coordinates: z.array(RingCoords).min(1) }),
])

export const CreateFeatureSchema = z.object({
  geometry: GeometrySchema,
  properties: z.object({
    name: z.string().min(1, 'กรุณาระบุชื่อสถานที่'),
    category: z.string().min(1).optional(),
  }).loose(),
})

export const UpdateFeatureSchema = CreateFeatureSchema.partial().refine(
  d => d.geometry !== undefined || d.properties !== undefined,
  { message: 'ต้องระบุ geometry หรือ properties อย่างน้อย 1 อย่าง' },
)
