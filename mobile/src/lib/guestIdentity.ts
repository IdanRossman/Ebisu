import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_ID_KEY = 'app_guest_id';

function makeUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getStoredGuestId(): Promise<string | null> {
  return AsyncStorage.getItem(GUEST_ID_KEY);
}

export async function resolveGuestId(): Promise<string> {
  const stored = await getStoredGuestId();
  if (stored) return stored;

  const id = makeUUID();
  await AsyncStorage.setItem(GUEST_ID_KEY, id);
  return id;
}
