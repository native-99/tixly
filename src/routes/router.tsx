import { createBrowserRouter } from 'react-router'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import EventDetailPage from '@/pages/event-detail/EventDetailPage'
import EventFormPage from '@/pages/event-form/EventFormPage'
import EventsPage from '@/pages/events/EventsPage'
import LoginPage from '@/pages/login/LoginPage'
import MyTicketsPage from '@/pages/my-tickets/MyTicketsPage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import OrganizerEventsPage from '@/pages/organizer-events/OrganizerEventsPage'
import RegisterPage from '@/pages/register/RegisterPage'
import ScanPage from '@/pages/scan/ScanPage'

// Role guards and the shared layout are added in the next phase.
export const router = createBrowserRouter([
  { path: '/', element: <EventsPage /> },
  { path: '/events/:eventId', element: <EventDetailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/checkout/:orderId', element: <CheckoutPage /> },
  { path: '/my-tickets', element: <MyTicketsPage /> },
  { path: '/organizer', element: <OrganizerEventsPage /> },
  { path: '/organizer/events/new', element: <EventFormPage /> },
  { path: '/organizer/events/:eventId/edit', element: <EventFormPage /> },
  { path: '/staff/scan', element: <ScanPage /> },
  { path: '*', element: <NotFoundPage /> },
])
