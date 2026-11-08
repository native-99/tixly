// Query keys in one place so invalidation stays consistent.

export const queryKeys = {
  currentUser: ['auth', 'current-user'] as const,
}
