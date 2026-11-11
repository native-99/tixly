// Query keys in one place so invalidation stays consistent.

export const queryKeys = {
  currentUser: ['auth', 'current-user'] as const,
  events: ['events'] as const,
  publishedEvents: ['events', 'published'] as const,
  myEvents: ['events', 'mine'] as const,
  event: (eventId: string) => ['events', 'detail', eventId] as const,
  order: (orderId: string) => ['orders', orderId] as const,
  myTickets: ['tickets', 'mine'] as const,
  myOrders: ['orders', 'mine'] as const,
}
