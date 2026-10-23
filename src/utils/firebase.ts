/**
 * Stub / No-op Firebase utility for 100% offline local-first mode.
 */
export const auth = null;
export const db = null;
export function onAuthUserChanged(_callback: (user: any) => void) {
  return () => {};
}
export async function syncDataToCloud() {
  return { success: true, timestamp: '', count: 0 };
}
export async function fetchDataFromCloud() {
  return { employees: [], manager: null };
}
export async function logoutFirebase() {}
export async function loginWithGoogle() {}
export function cleanFirestoreData(data: any) {
  return data;
}
