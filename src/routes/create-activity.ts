import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from '../lib/day';
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                accours_at: z.coerce.date(),

            })
        }
    }, async (request) => {
        const { tripId } = request.params
        const { title, accours_at } = request.body

        const trip = await prisma.trip.findUnique({
            where: {id: tripId},
        })

        if (!trip){
            throw new Error('Trip not found')
        }

        if (dayjs(accours_at).isBefore(trip.starts_at)) {
            throw new Error('Invalid activity date.')
        }

        if (dayjs(accours_at).isAfter(trip.ends_at)) {
            throw new Error('Invalid activity date')
        }

        const activity = await prisma.activity.create({
            data: {
                title,
                accours_at,
                trip_id: tripId
            }
        })

        return { activityId: activity.id }
    })
}