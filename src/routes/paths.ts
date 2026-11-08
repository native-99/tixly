// Route paths in one place, so links never drift from the router.

export const paths = {
  events: '/',
  eventDetail: (eventId: string) => `/events/${eventId}`,
  login: '/login',
  register: '/register',
  checkout: (orderId: string) => `/checkout/${orderId}`,
  myTickets: '/my-tickets',
  organizerEvents: '/organizer',
  newEvent: '/organizer/events/new',
  editEvent: (eventId: string) => `/organizer/events/${eventId}/edit`,
  scan: '/staff/scan',
} as const
