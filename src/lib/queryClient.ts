import { QueryClient } from '@tanstack/react-query'
import { AppError } from '@/services'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying won't fix "not signed in" or "not allowed" errors.
      retry: (failureCount, error) => {
        if (error instanceof AppError) return false
        return failureCount < 2
      },
    },
  },
})
