export const CASTING_EVENT_VERSION = 1 as const;
export const CASTING_EVENT_SOURCE = 'casting-attual-360' as const;
export const ATTUAL_ONE_TARGET = 'attual-one' as const;

export const CASTING_EVENT_TYPES = {
  invitationPrepared: 'casting.invitation.prepared',
  telegramLinked: 'casting.telegram.linked',
  invitationSent: 'casting.invitation.sent',
  invitationAccepted: 'casting.invitation.accepted',
  invitationDeclined: 'casting.invitation.declined',
} as const;

export type CastingEventType = typeof CASTING_EVENT_TYPES[keyof typeof CASTING_EVENT_TYPES];

export type CastingEventContext = {
  productionId: string;
  castingCallId: string;
  shortlistId: string;
  invitationId: string;
  talentId: string;
};

export function castingIntegrationEvent(
  eventType: CastingEventType,
  context: CastingEventContext,
  payload: Record<string, unknown>,
) {
  return {
    event_type: eventType,
    source_system: CASTING_EVENT_SOURCE,
    target_system: ATTUAL_ONE_TARGET,
    production_id: context.productionId,
    casting_call_id: context.castingCallId,
    shortlist_id: context.shortlistId,
    invitation_id: context.invitationId,
    talent_id: context.talentId,
    payload: {
      event_version: CASTING_EVENT_VERSION,
      invitation_id: context.invitationId,
      shortlist_id: context.shortlistId,
      casting_call_id: context.castingCallId,
      production_id: context.productionId,
      talent_id: context.talentId,
      ...payload,
    },
  };
}
