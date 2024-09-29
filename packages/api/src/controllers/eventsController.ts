import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  GetEventsRequest,
  GetEventsResponse,
  GetEventsResponseItem,
  GetPropertiesRequest,
  GetPropertiesResponse,
  GetTraitsRequest,
  GetTraitsResponse,
} from "backend-lib/src/types";
import {
  findIdentifyTraits,
  findManyEventsWithCount,
  findTrackProperties,
} from "backend-lib/src/userEvents";
import { FastifyInstance } from "fastify";

// eslint-disable-next-line @typescript-eslint/require-await
export default async function eventsController(fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    "/",
    {
      schema: {
        description: "Get list of events",
        tags: ["Events"],
        querystring: GetEventsRequest,
        response: {
          200: GetEventsResponse,
        },
      },
    },
    async (request, reply) => {
      const {
        workspaceId,
        limit,
        offset,
        startDate,
        endDate,
        userId,
        searchTerm,
      } = request.query;

      const { events: eventsRaw, count } = await findManyEventsWithCount({
        workspaceId,
        limit,
        offset,
        startDate,
        endDate,
        userId,
        searchTerm,
      });

      const events: GetEventsResponseItem[] = eventsRaw.flatMap(
        ({
          message_id,
          processing_time,
          user_id,
          event_type,
          anonymous_id,
          event,
          event_time,
          traits,
          properties,
        }) => {
          let colsolidatedTraits: string;
          if (traits.length) {
            colsolidatedTraits = traits;
          } else if (properties.length) {
            colsolidatedTraits = properties;
          } else {
            colsolidatedTraits = "{}";
          }
          return {
            messageId: message_id,
            processingTime: processing_time,
            userId: user_id,
            eventType: event_type,
            anonymousId: anonymous_id,
            event,
            eventTime: event_time,
            traits: colsolidatedTraits,
          };
        },
      );
      return reply.status(200).send({
        events,
        count,
      });
    },
  );

  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    "/traits",
    {
      schema: {
        description: "Get list of traits available on identify calls",
        tags: ["Events"],
        querystring: GetTraitsRequest,
        response: {
          200: GetTraitsResponse,
        },
      },
    },
    async (request, reply) => {
      const traits = await findIdentifyTraits({
        workspaceId: request.query.workspaceId,
      });
      return reply.status(200).send({ traits });
    },
  );

  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    "/properties",
    {
      schema: {
        description: "Get list of properties available on performed calls",
        tags: ["Events"],
        querystring: GetPropertiesRequest,
        response: {
          200: GetPropertiesResponse,
        },
      },
    },
    async (request, reply) => {
      const properties = await findTrackProperties({
        workspaceId: request.query.workspaceId,
      });
      return reply.status(200).send({ properties });
    },
  );
}
