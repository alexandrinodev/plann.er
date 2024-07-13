import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from '../lib/day'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'
import { getMailClient } from "../lib/mail";
import { z } from "zod"
import { prisma } from "../lib/prisma";
import nodemailer from 'nodemailer'
import { create } from "domain";

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email())
            })
        }
    }, async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        if (dayjs(starts_at).isBefore(new Date())) {
            throw new Error('Invalid trip start date.')
        }

        if (dayjs(ends_at).isBefore(new Date())) {
            throw new Error('Invalid trip end date')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [{
                            name: owner_name,
                            email: owner_email,
                            is_owner: true,
                            is_confirmed: true
                        },
                        ...emails_to_invite.map(email => {
                            return { email }
                        })]
                    }
                }
            }
        })

        const formattedStartDate = dayjs(starts_at).format('LL')
        const formattedEndDate = dayjs(ends_at).format('LL')

        const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`
        

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'oi@plann.er'
            },
            to: {
                name: owner_name,
                address: owner_email
            },
            subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
            html: `
                <div style="font-size: 16px; line-height: 1.6;">
                    <p>Voce solicitou a criação de uma viagem para <strong>${destination}</strong>, Brasil nas datas de <strong>${formattedStartDate} até ${formattedStartDate}</strong>.</p>
                    <p></p>
                    <p>Para confirmar sua viagem, Click no link abaixo</p>
                    <p></p>
                    <p><a href="${confirmationLink}">Confirmar viagem</a></p>
                    <p></p>
                    <p>Caso voce nao saiva do que se trata esse e-mail, apenas ignore esse e-mail</p>
                    <p></p>
                </div>
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}