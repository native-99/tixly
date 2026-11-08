import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactNode } from 'react'
import { queryKeys } from '@/lib/queryKeys'
import { services, type SignUpInput } from '@/services'
import type { User } from '@/types'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const currentUserQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => services.auth.getCurrentUser(),
    staleTime: Infinity,
  })

  // When the user changes, store the new user and drop every other cached
  // query, so data from the previous user (tickets, orders, …) can't leak.
  const replaceUser = useCallback(
    (user: User | null) => {
      queryClient.setQueryData(queryKeys.currentUser, user)
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.currentUser[0],
      })
    },
    [queryClient],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await services.auth.signIn(email, password)
      replaceUser(user)
      return user
    },
    [replaceUser],
  )

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const user = await services.auth.signUp(input)
      replaceUser(user)
      return user
    },
    [replaceUser],
  )

  const signOut = useCallback(async () => {
    await services.auth.signOut()
    replaceUser(null)
  }, [replaceUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isLoading: currentUserQuery.isPending,
      signIn,
      signUp,
      signOut,
    }),
    [currentUserQuery.data, currentUserQuery.isPending, signIn, signUp, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
