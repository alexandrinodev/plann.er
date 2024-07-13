import fastify from "fastify"
import cors from "@fastify/cors"
import { createTrip } from "./routes/create-trip"
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { ConfirmTrip } from "./routes/confirm-trip";
import { ConfirmParticipants } from "./routes/confirm-participant";


const app = fastify()

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
    origin: '*'
})

app.register(createTrip)
app.register(ConfirmTrip)
app.register(ConfirmParticipants)

app.listen({port: 3333}).then(() => {
    console.log("server running!")
})