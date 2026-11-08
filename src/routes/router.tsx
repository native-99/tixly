import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import AccountPage from '@/pages/account/AccountPage'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import RouteErrorPage from '@/pages/error/RouteErrorPage'
import EventDetailPage from '@/pages/event-detail/EventDetailPage'
import EventFormPage from '@/pages/event-form/EventFormPage'
import EventsPage from '@/pages/events/EventsPage'
import LoginPage from '@/pages/login/LoginPage'
import MyTicketsPage from '@/pages/my-tickets/MyTicketsPage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import OrganizerEventsPage from '@/pages/organizer-events/OrganizerEventsPage'
import RegisterPage from '@/pages/register/RegisterPage'
import ScanPage from '@/pages/scan/ScanPage'
import { GuestOnly, RequireAuth } from './guards'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          // Public
          { index: true, element: <EventsPage /> },
          { path: 'events/:eventId', element: <EventDetailPage /> },

          // Any signed-in user
          {
            element: <RequireAuth />,
            children: [{ path: 'account', element: <AccountPage /> }],
          },

          // Buyer
          {
            element: <RequireAuth roles={['buyer']} />,
            children: [
              { path: 'checkout/:orderId', element: <CheckoutPage /> },
              { path: 'my-tickets', element: <MyTicketsPage /> },
            ],
          },

          // Organizer
          {
            element: <RequireAuth roles={['organizer']} />,
            children: [
              { path: 'organizer', element: <OrganizerEventsPage /> },
              { path: 'organizer/events/new', element: <EventFormPage /> },
              { path: 'organizer/events/:eventId/edit', element: <EventFormPage /> },
            ],
          },

          // Gate staff
          {
            element: <RequireAuth roles={['staff']} />,
            children: [{ path: 'staff/scan', element: <ScanPage /> }],
          },
        ],
      },

      // Signed-out only
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
