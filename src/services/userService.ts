import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

// Following is stored as an array on the follower's own user document, so a
// follow/unfollow is just a self-update (allowed by the existing owner rule).
export async function followUser(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', myUid), { following: arrayUnion(targetUid) });
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', myUid), { following: arrayRemove(targetUid) });
}

// Followers = everyone whose `following` array contains this user.
export async function countFollowers(uid: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, 'users'), where('following', 'array-contains', uid)),
  );
  return snap.data().count;
}

// Resolve a list of uids to their user documents (missing/deleted ones dropped).
export async function fetchUsersByIds(uids: string[]): Promise<User[]> {
  if (uids.length === 0) return [];
  const snaps = await Promise.all(uids.map((id) => getDoc(doc(db, 'users', id))));
  return snaps
    .filter((s) => s.exists())
    .map((s) => ({ ...(s.data() as object), uid: s.id } as User));
}

// The users who follow `uid` (their `following` array contains it).
export async function fetchFollowers(uid: string): Promise<User[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('following', 'array-contains', uid)),
  );
  return snap.docs.map((d) => ({ ...(d.data() as object), uid: d.id } as User));
}

// The users `uid` follows (resolved from its own `following` array).
export async function fetchFollowing(uid: string): Promise<User[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  const ids = (snap.exists() ? (snap.data().following as string[] | undefined) : undefined) ?? [];
  return fetchUsersByIds(ids);
}