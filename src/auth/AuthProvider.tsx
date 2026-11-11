import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { clearOfflineCache, readOfflineCache } from '@/lib/offlineCache'
import { queryKeys } from '@/lib/queryKeys'
import { services, type SignUpInput } from '@/services'
import type { User } from '@/types'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const currentUserQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => services.auth.getCurrentUser(),
    // An offline reload paints the saved profile immediately; the query still
    // runs and fixes it as soon as the network is back.
    initialData: () => readOfflineCache<User>('profile') ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: Infinity,
    retry: 1,
  })

  // undefined = identity not known yet. That first resolution must not wipe the
  // offline copies, or an offline reload would lose the cached tickets.
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (lastUserId.current !== undefined || currentUserQuery.isPending) return
    lastUserId.current = currentUserQuery.data?.id ?? null
  }, [currentUserQuery.data, currentUserQuery.isPending])

  // When the user changes, store the new user and drop every other cached
  // query, so data from the previous user (tickets, orders, …) can't leak.
  const replaceUser = useCallback(
    (user: User | null) => {
      const next = user?.id ?? null
      const previous = lastUserId.current
      if (previous !== undefined && previous !== next) {
        // A different buyer keeps only their own saved lists. Signing out drops
        // the profile cache too.
        clearOfflineCache(next === null ? undefined : ['tickets', 'orders'])
      }
      lastUserId.current = next

      queryClient.setQueryData(queryKeys.currentUser, user)
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.currentUser[0],
      })
    },
    [queryClient],
  )

  // Live session updates: magic-link sign-in, token refresh, sign-out in
  // another tab. Only swap the cached user when the identity actually changes,
  // so a token refresh doesn't throw away every cached page.
  useEffect(() => {
    const unsubscribe = services.auth.onAuthChange?.((user) => {
      const current = queryClient.getQueryData<User | null>(queryKeys.currentUser) ?? null
      if ((current?.id ?? null) === (user?.id ?? null)) return
      replaceUser(user)
    })
    return unsubscribe
  }, [queryClient, replaceUser])

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

  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    await services.auth.sendMagicLink(email, redirectTo)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isLoading: currentUserQuery.isPending,
      signIn,
      signUp,
      signOut,
      sendMagicLink,
    }),
    [currentUserQuery.data, currentUserQuery.isPending, signIn, signUp, signOut, sendMagicLink],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
