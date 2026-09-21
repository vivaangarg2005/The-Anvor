export const authStore = {
  currentUserId: null as string | null,
};

export const setClientUserId = (id: string | null) => {
  authStore.currentUserId = id;
};

export const getClientUserId = () => authStore.currentUserId;
