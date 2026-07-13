import { z } from 'zod'

export const CoordinatesSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

export const CreateFeatureSchema = z.object({
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: CoordinatesSchema,
  }),
  properties: z.object({
    name: z.string().min(1, 'กรุณาระบุชื่อสถานที่'),
  }).passthrough(),
})

export const UpdateFeatureSchema = CreateFeatureSchema.partial()
